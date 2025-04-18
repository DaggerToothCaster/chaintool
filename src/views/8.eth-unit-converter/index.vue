<template>
  <div class="main-box">
      <h2>🔄 以太坊单位转换器</h2>

      <el-tabs v-model="activeTab">
          <!-- 单位转换 -->
          <el-tab-pane label="单位转换" name="convert">
              <el-form label-position="top">
                  <el-form-item label="输入数值">
                      <el-input
                          v-model="inputValue"
                          placeholder="输入数值"
                          clearable
                          @input="convertAll"
                      />
                  </el-form-item>

                  <el-form-item label="输入单位">
                      <el-select v-model="inputUnit" @change="convertAll">
                          <el-option
                              v-for="unit in units"
                              :key="unit.value"
                              :label="unit.label"
                              :value="unit.value"
                          />
                      </el-select>
                  </el-form-item>

                  <el-form-item label="转换结果">
                      <el-table :data="resultTableData" style="width: 100%">
                          <el-table-column prop="unit" label="单位" width="180" />
                          <el-table-column prop="value" label="值" />
                          <el-table-column label="操作" width="120">
                              <template slot-scope="scope">
                                  <el-button
                                      size="mini"
                                      @click="copyResult(scope.row.rawValue)"
                                      :disabled="scope.row.value === 'N/A' || !scope.row.value"
                                  >
                                      复制
                                  </el-button>
                              </template>
                          </el-table-column>
                      </el-table>
                  </el-form-item>
              </el-form>
          </el-tab-pane>

          <!-- 常见单位 -->
          <el-tab-pane label="常见单位" name="presets">
              <el-table :data="units" style="width: 100%">
                  <el-table-column prop="label" label="单位" />
                  <el-table-column prop="value" label="值" />
                  <el-table-column label="操作" width="120">
                      <template slot-scope="scope">
                          <el-button size="mini" @click="useUnit(scope.row.value)">使用</el-button>
                      </template>
                  </el-table-column>
              </el-table>
          </el-tab-pane>

          <!-- 使用帮助 -->
          <el-tab-pane label="使用帮助" name="help">
              <div style="line-height: 1.8;">
                  <p><strong>🔄 单位转换：</strong></p>
                  <ul>
                      <li>输入数值并选择输入单位（如 <code>Ether</code>）</li>
                      <li>自动转换为所有其他单位（Wei, Gwei 等）</li>
                      <li>点击"复制"按钮复制转换结果</li>
                  </ul>
                  <p><strong>📎 提示：</strong> 转换基于 @ethersproject/units，使用高精度计算以确保准确性。</p>
              </div>
          </el-tab-pane>
      </el-tabs>
  </div>
</template>

<script>
import { parseUnits, formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export default {
  name: 'EthereumUnitConverter',
  data() {
      return {
          activeTab: 'convert',
          inputValue: '',
          inputUnit: 'ether',
          precision: 18,
          results: {},
          units: [
              { label: 'Wei', value: 'wei' },
              { label: 'Kwei (Babbage)', value: 'kwei' },
              { label: 'Mwei (Lovelace)', value: 'mwei' },
              { label: 'Gwei (Shannon)', value: 'gwei' },
              { label: 'Microether (Szabo)', value: 'micro' },
              { label: 'Milliether (Finney)', value: 'milli' },
              { label: 'Ether', value: 'ether' },
          ],
      };
  },
  computed: {
      resultTableData() {
          return this.units.map(unit => ({
              unit: unit.label,
              value: this.formatResult(this.results[unit.value], unit.value),
              rawValue: this.results[unit.value], // Store raw value for copying
          }));
      },
  },
  methods: {
      convertAll() {
          if (!this.inputValue || isNaN(this.inputValue) || this.inputValue.trim() === '') {
              this.clearResults();
              return;
          }

          const input = this.inputValue.toString().trim();
          this.results = {};

          try {
              // Ensure input is valid and convert to wei (base unit)
              const weiValue = parseUnits(input, this.getUnitDecimals(this.inputUnit));

              // Convert to all other units
              this.units.forEach(unit => {
                  try {
                      if (unit.value === 'wei') {
                          // For wei, use the exact integer value
                          this.results[unit.value] = weiValue.toString();
                      } else {
                          // Convert to target unit with proper decimal handling
                          const formatted = formatUnits(weiValue, this.getUnitDecimals(unit.value));
                          this.results[unit.value] = formatted;
                      }
                  } catch (e) {
                      this.results[unit.value] = 'N/A';
                  }
              });
          } catch (e) {
              console.error('转换失败:', e);
              this.$message.error('输入值超出范围或格式不正确');
              this.clearResults();
          }
      },

      getUnitDecimals(unit) {
          const unitMap = {
              wei: 0,
              kwei: 3,
              mwei: 6,
              gwei: 9,
              micro: 12,
              milli: 15,
              ether: 18,
          };
          return unitMap[unit] || 18;
      },

      formatResult(value, unit) {
          if (value === 'N/A' || !value) return value || '0';

          // For wei, display the full integer value
          if (unit === 'wei') {
              return value;
          }

          // Handle decimal places for other units
          const [integer, decimal] = value.split('.');
          if (!decimal) return integer;

          // Trim to specified precision or unit's decimal places
          const maxDecimals = this.getUnitDecimals(unit);
          const trimmedDecimal = decimal.slice(0, Math.min(this.precision, maxDecimals));

          // If decimal is all zeros, show only integer
          if (/^0+$/.test(trimmedDecimal)) {
              return integer;
          }

          return `${integer}.${trimmedDecimal}`;
      },

      copyResult(value) {
          if (!value || value === 'N/A') return;

          const textToCopy = value.toString();
          navigator.clipboard.writeText(textToCopy)
              .then(() => {
                  this.$message.success(`已复制: ${textToCopy}`);
              })
              .catch(err => {
                  console.error('复制失败:', err);
                  this.$message.error('复制失败，请手动复制');
              });
      },

      clearResults() {
          this.results = {};
          this.units.forEach(unit => {
              this.results[unit.value] = '';
          });
      },

      useUnit(unitValue) {
          this.inputUnit = unitValue;
          this.activeTab = 'convert';
          this.convertAll();
      },
  },
  mounted() {
      this.clearResults();
  },
};
</script>

<style scoped>
.main-box {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-button {
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
}

code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
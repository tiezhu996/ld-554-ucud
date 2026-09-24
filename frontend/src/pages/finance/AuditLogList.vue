<template>
  <AppLayout>
    <div class="page-title">
      <h1>操作日志</h1>
      <span class="scope-tip">{{ isOwner ? '可查看全部门店的财务变更记录' : '仅显示本门店的财务变更记录' }}</span>
    </div>
    <div class="panel filters">
      <el-select v-model="filters.operatorId" placeholder="经办人" clearable filterable>
        <el-option v-for="operator in operators" :key="operator.id" :label="operator.username" :value="operator.id" />
      </el-select>
      <el-select v-model="filters.action" placeholder="动作" clearable>
        <el-option v-for="(label, value) in AuditActionLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
      <StoreSelector v-if="isOwner" @change="(value) => filters.storeId = value as number" />
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>
    <div class="panel">
      <el-table :data="logs.list" row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="diff">
              <div class="diff-col">
                <h3>修改前</h3>
                <dl v-if="beforeEntries(row).length">
                  <template v-for="entry in beforeEntries(row)" :key="entry.label">
                    <dt>{{ entry.label }}</dt>
                    <dd :class="{ changed: entry.changed }">{{ entry.value }}</dd>
                  </template>
                </dl>
                <el-text v-else type="info">（新记录，无修改前内容）</el-text>
              </div>
              <div class="diff-col">
                <h3>修改后</h3>
                <dl v-if="afterEntries(row).length">
                  <template v-for="entry in afterEntries(row)" :key="entry.label">
                    <dt>{{ entry.label }}</dt>
                    <dd :class="{ changed: entry.changed }">{{ entry.value }}</dd>
                  </template>
                </dl>
                <el-text v-else type="info">（记录已删除）</el-text>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="170">
          <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
        </el-table-column>
        <el-table-column label="经办人" width="120">
          <template #default="{ row }">{{ row.User?.username ?? '系统' }}</template>
        </el-table-column>
        <el-table-column label="动作" width="110">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="门店" width="140">
          <template #default="{ row }">{{ row.Store?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="target" label="单据" width="150" />
        <el-table-column prop="ip" label="IP" />
      </el-table>
      <el-pagination
        class="pagination"
        layout="total, prev, pager, next"
        :total="logs.total"
        :page-size="logs.pageSize"
        :current-page="logs.page"
        @current-change="(page: number) => load(page)"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import StoreSelector from '@/components/common/StoreSelector.vue';
import { AuditAction, AuditActionLabel, TransactionCategoryLabel, TransactionTypeLabel } from '@/constants/enums';
import { useAuditLogStore } from '@/stores/auditLogStore';
import { fetchAuditOperators } from '@/api/auditLog';
import { usePermission } from '@/hooks/usePermission';
import { money } from '@/utils/format';
import type { AuditLog, AuditOperator } from '@/types/audit-log';

const logs = useAuditLogStore();
const { isOwner } = usePermission();
const operators = ref<AuditOperator[]>([]);
const filters = reactive<Record<string, unknown>>({});
const dateRange = ref<[string, string] | null>(null);

const fieldLabels: Record<string, string> = {
  id: '单据 ID',
  type: '类型',
  category: '分类',
  amount: '金额',
  description: '描述',
  relatedEmployeeId: '关联员工 ID',
  storeId: '门店 ID',
  date: '发生日期',
  receipt: '凭证',
  reviewed: '审核状态'
};

function parseValue(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatField(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'type') return TransactionTypeLabel[value as keyof typeof TransactionTypeLabel] ?? String(value);
  if (key === 'category') return TransactionCategoryLabel[value as keyof typeof TransactionCategoryLabel] ?? String(value);
  if (key === 'amount') return money(value as number | string);
  if (key === 'reviewed') return value ? '已审核' : '未审核';
  return String(value);
}

function entries(row: AuditLog, side: 'oldValue' | 'newValue') {
  const current = parseValue(row[side]);
  const other = parseValue(side === 'oldValue' ? row.newValue : row.oldValue);
  return Object.keys(fieldLabels)
    .filter((key) => key in current)
    .map((key) => ({
      label: fieldLabels[key],
      value: formatField(key, current[key]),
      changed: key in other && String(current[key]) !== String(other[key])
    }));
}

const beforeEntries = (row: AuditLog) => entries(row, 'oldValue');
const afterEntries = (row: AuditLog) => entries(row, 'newValue');

function actionLabel(action: AuditLog['action']) {
  return AuditActionLabel[action] ?? action;
}

function actionTagType(action: AuditLog['action']) {
  if (action === AuditAction.DELETE_TRANSACTION) return 'danger';
  if (action === AuditAction.UPDATE_TRANSACTION) return 'warning';
  if (action === AuditAction.REVIEW_TRANSACTION) return 'success';
  return 'primary';
}

function formatTime(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
}

async function load(page = 1) {
  const params: Record<string, unknown> = { ...filters, page };
  if (dateRange.value?.[0]) params.startDate = dateRange.value[0];
  if (dateRange.value?.[1]) params.endDate = dateRange.value[1];
  await logs.load(params);
}

function search() {
  void load(1);
}

function reset() {
  Object.keys(filters).forEach((key) => delete filters[key]);
  dateRange.value = null;
  void load(1);
}

onMounted(async () => {
  await load();
  const response = await fetchAuditOperators() as { data: AuditOperator[] };
  operators.value = response.data;
});
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.scope-tip {
  color: #6b7280;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.diff {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 8px 24px;
}

.diff-col h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.diff-col dl {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 6px 12px;
  margin: 0;
}

.diff-col dt {
  color: #6b7280;
}

.diff-col dd {
  margin: 0;
  word-break: break-all;
}

.diff-col dd.changed {
  color: #b45309;
  font-weight: 600;
}
</style>

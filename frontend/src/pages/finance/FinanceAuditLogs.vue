<template>
  <AppLayout>
    <div class="page-title">
      <h1>财务操作日志</h1>
      <el-button @click="goBack">返回财务列表</el-button>
    </div>
    <div class="panel scope-tip">
      <el-tag :type="isOwner ? 'primary' : 'warning'">
        {{ isOwner ? '老板视角：可查看全部门店的财务变更日志' : '店长视角：仅可查看本门店的财务变更日志' }}
      </el-tag>
    </div>
    <div class="panel filters">
      <el-select v-model="filters.operatorId" placeholder="经办人" clearable filterable @change="load">
        <el-option v-for="op in operators" :key="op.id" :label="op.username" :value="op.id" />
      </el-select>
      <el-select v-model="filters.action" placeholder="动作" clearable @change="load">
        <el-option v-for="(label, value) in FinanceAuditActionLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <StoreSelector v-if="isOwner" @change="(value) => onStoreChange(value as number)" />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="onDateChange"
      />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>
    <div class="panel">
      <el-table v-loading="loading" :data="logs">
        <el-table-column label="发生时间" width="180">
          <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
        </el-table-column>
        <el-table-column label="经办人" width="120">
          <template #default="{ row }">{{ row.operator?.username ?? (row.operatorId ? `用户#${row.operatorId}` : '未知') }}</template>
        </el-table-column>
        <el-table-column label="动作" width="100">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)">{{ FinanceAuditActionLabel[row.action as keyof typeof FinanceAuditActionLabel] ?? row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="门店" width="140">
          <template #default="{ row }">{{ row.store?.name ?? (row.storeId ? `门店#${row.storeId}` : '-') }}</template>
        </el-table-column>
        <el-table-column label="账目ID" prop="targetId" width="90" />
        <el-table-column label="修改前内容">
          <template #default="{ row }">
            <el-button v-if="row.oldValue" link type="info" @click="showContent('修改前内容', row.oldValue)">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="修改后内容">
          <template #default="{ row }">
            <el-button v-if="row.newValue" link type="primary" @click="showContent('修改后内容', row.newValue)">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130" />
      </el-table>
      <el-pagination
        class="pager"
        layout="total, prev, pager, next, sizes"
        :total="total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <el-dialog v-model="contentVisible" :title="contentTitle" width="640px">
      <el-descriptions v-if="contentFields.length" :column="1" border>
        <el-descriptions-item v-for="field in contentFields" :key="field.label" :label="field.label">
          {{ field.value }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '@/components/layout/AppLayout.vue';
import StoreSelector from '@/components/common/StoreSelector.vue';
import { FinanceAuditActionLabel, TransactionCategoryLabel, TransactionTypeLabel } from '@/constants/enums';
import { fetchFinanceLogs, fetchAuditOperators, type AuditLogQuery } from '@/api/auditLog';
import { usePermission } from '@/hooks/usePermission';
import type { AuditLog, AuditLogOperator, AuditLogPage } from '@/types/auditLog';

interface ContentField { label: string; value: string }

const router = useRouter();
const { isOwner } = usePermission();

const filters = reactive<AuditLogQuery>({ page: 1, pageSize: 20 });
const dateRange = ref<[string, string] | null>(null);
const logs = ref<AuditLog[]>([]);
const operators = ref<AuditLogOperator[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const contentVisible = ref(false);
const contentTitle = ref('');
const contentFields = ref<ContentField[]>([]);

const FIELD_LABELS: Record<string, string> = {
  type: '类型',
  category: '分类',
  amount: '金额',
  description: '描述',
  storeId: '门店ID',
  relatedEmployeeId: '关联员工ID',
  date: '发生日期',
  receipt: '凭证',
  reviewed: '审核状态',
  createdAt: '创建时间',
  updatedAt: '更新时间'
};

async function load() {
  loading.value = true;
  try {
    const res = await fetchFinanceLogs(filters) as { data: AuditLogPage };
    logs.value = res.data.list;
    total.value = res.data.total;
    page.value = res.data.page;
    pageSize.value = res.data.pageSize;
  } finally {
    loading.value = false;
  }
}

async function loadOperators() {
  const res = await fetchAuditOperators() as { data: AuditLogOperator[] };
  operators.value = res.data;
}

function onStoreChange(storeId?: number) {
  if (storeId) filters.storeId = storeId;
  else delete filters.storeId;
  load();
}

function onDateChange(value: [string, string] | null) {
  if (value) {
    filters.startDate = value[0];
    filters.endDate = value[1];
  } else {
    delete filters.startDate;
    delete filters.endDate;
  }
  load();
}

function resetFilters() {
  filters.operatorId = undefined;
  filters.action = undefined;
  filters.storeId = undefined;
  filters.startDate = undefined;
  filters.endDate = undefined;
  filters.page = 1;
  dateRange.value = null;
  load();
}

function onPageChange(next: number) {
  filters.page = next;
  load();
}

function onSizeChange(size: number) {
  filters.pageSize = size;
  filters.page = 1;
  load();
}

function formatTime(value: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function formatValue(key: string, raw: unknown): string {
  if (raw === null || raw === undefined) return '-';
  if (key === 'type') return TransactionTypeLabel[String(raw) as keyof typeof TransactionTypeLabel] ?? String(raw);
  if (key === 'category') return TransactionCategoryLabel[String(raw) as keyof typeof TransactionCategoryLabel] ?? String(raw);
  if (key === 'reviewed') return raw ? '已审核' : '待审核';
  if (key === 'amount') return `¥${raw}`;
  return String(raw);
}

function showContent(title: string, json: string) {
  contentTitle.value = title;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    contentFields.value = Object.entries(parsed)
      .filter(([key]) => FIELD_LABELS[key])
      .map(([key, value]) => ({ label: FIELD_LABELS[key], value: formatValue(key, value) }));
  } catch {
    contentFields.value = [{ label: '原始内容', value: json }];
  }
  contentVisible.value = true;
}

function actionTagType(action: string) {
  if (action === 'CREATE_TRANSACTION') return 'success';
  if (action === 'UPDATE_TRANSACTION') return 'primary';
  if (action === 'DELETE_TRANSACTION') return 'danger';
  if (action === 'REVIEW_TRANSACTION') return 'warning';
  return 'info';
}

function goBack() {
  router.push('/finance');
}

onMounted(() => {
  load();
  loadOperators();
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
  margin-bottom: 14px;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>

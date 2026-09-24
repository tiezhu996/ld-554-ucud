<template>
  <AppLayout>
    <div class="page-title">
      <h1>财务管理</h1>
      <el-button v-permission="['OWNER','MANAGER']" type="primary" :icon="Plus" @click="openCreate">新增记账</el-button>
    </div>
    <div class="panel filters">
      <el-select v-model="filters.type" placeholder="类型" clearable>
        <el-option v-for="(label, value) in TransactionTypeLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <el-select v-model="filters.category" placeholder="分类" clearable>
        <el-option v-for="(label, value) in TransactionCategoryLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <StoreSelector @change="(value) => filters.storeId = value as number" />
      <el-button @click="load">筛选</el-button>
    </div>
    <div class="grid cols-2">
      <div class="panel">
        <el-table :data="transactions.list">
          <el-table-column prop="date" label="日期" />
          <el-table-column label="类型"><template #default="{ row }">{{ TransactionTypeLabel[row.type as keyof typeof TransactionTypeLabel] }}</template></el-table-column>
          <el-table-column label="分类"><template #default="{ row }">{{ TransactionCategoryLabel[row.category as keyof typeof TransactionCategoryLabel] }}</template></el-table-column>
          <el-table-column label="金额"><template #default="{ row }">{{ money(row.amount) }}</template></el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column label="审核状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.reviewed ? 'success' : 'info'">{{ row.reviewed ? '已审核' : '待审核' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130">
            <template #default="{ row }">
              <el-button v-permission="['OWNER']" text type="primary" @click="openEdit(row)">修改</el-button>
              <el-button v-if="!row.reviewed" v-permission="['OWNER']" text type="success" @click="review(row)">审核</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="panel"><FinanceChart type="pie" title="分类统计" :labels="categoryLabels" :values="categoryValues" /></div>
      <div class="panel"><FinanceReport /></div>
    </div>
    <el-drawer v-model="formVisible" :title="editing ? '修改账目' : '记账表单'">
      <FinanceForm v-if="formVisible" :initial="editing" :saving="saving" @submit="save" />
    </el-drawer>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AppLayout from '@/components/layout/AppLayout.vue';
import StoreSelector from '@/components/common/StoreSelector.vue';
import FinanceChart from '@/components/common/FinanceChart.vue';
import FinanceForm from './FinanceForm.vue';
import FinanceReport from './FinanceReport.vue';
import { TransactionCategoryLabel, TransactionTypeLabel } from '@/constants/enums';
import { useTransactionStore } from '@/stores/transactionStore';
import { createTransaction, reviewTransaction, updateTransaction } from '@/api/transaction';
import { money } from '@/utils/format';
import type { Transaction } from '@/types/transaction';

const transactions = useTransactionStore();
const filters = reactive<Record<string, unknown>>({});
const formVisible = ref(false);
const saving = ref(false);
const editing = ref<Transaction | null>(null);
const categoryLabels = computed(() => Object.values(TransactionCategoryLabel));
const categoryValues = computed(() => Object.keys(TransactionCategoryLabel).map((key) => transactions.list.filter((item) => item.category === key).reduce((sum, item) => sum + Number(item.amount), 0)));

async function load() {
  await transactions.load(filters);
}

function openCreate() {
  editing.value = null;
  formVisible.value = true;
}

function openEdit(row: Transaction) {
  editing.value = row;
  formVisible.value = true;
}

async function save(payload: Record<string, unknown>) {
  saving.value = true;
  try {
    if (editing.value) {
      await updateTransaction(editing.value.id, payload);
      ElMessage.success('修改已保存');
    } else {
      await createTransaction(payload);
      ElMessage.success('记账成功');
    }
    formVisible.value = false;
    editing.value = null;
    await load();
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(`保存失败：${message ?? '账目未生效，请重试'}`);
  } finally {
    saving.value = false;
  }
}

async function review(row: Transaction) {
  try {
    await ElMessageBox.confirm(`确认审核通过「${row.description}」（${money(row.amount)}）？`, '审核确认', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await reviewTransaction(row.id);
    ElMessage.success('审核完成');
    await load();
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(`审核失败：${message ?? '请重试'}`);
  }
}

onMounted(load);
</script>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}
</style>

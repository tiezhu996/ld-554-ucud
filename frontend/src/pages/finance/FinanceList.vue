<template>
  <AppLayout>
    <div class="page-title">
      <h1>财务管理</h1>
      <div class="title-actions">
        <el-button v-permission="['OWNER','MANAGER']" @click="goLogs">操作日志</el-button>
        <el-button v-permission="['OWNER','MANAGER']" type="primary" :icon="Plus" @click="openCreate">新增记账</el-button>
      </div>
    </div>
    <div class="panel filters">
      <el-select v-model="filters.type" placeholder="类型" clearable>
        <el-option v-for="(label, value) in TransactionTypeLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <el-select v-model="filters.category" placeholder="分类" clearable>
        <el-option v-for="(label, value) in TransactionCategoryLabel" :key="value" :label="label" :value="value" />
      </el-select>
      <StoreSelector v-if="isOwner" @change="(value) => filters.storeId = value as number" />
      <el-button @click="load">筛选</el-button>
    </div>
    <div class="grid cols-2">
      <div class="panel">
        <el-table :data="transactions.list">
          <el-table-column prop="date" label="日期" />
          <el-table-column label="类型"><template #default="{ row }">{{ TransactionTypeLabel[row.type as keyof typeof TransactionTypeLabel] }}</template></el-table-column>
          <el-table-column label="分类"><template #default="{ row }">{{ TransactionCategoryLabel[row.category as keyof typeof TransactionCategoryLabel] }}</template></el-table-column>
          <el-table-column label="金额"><template #default="{ row }">{{ money(row.amount) }}</template></el-table-column>
          <el-table-column label="门店"><template #default="{ row }">{{ row.Store?.name ?? `#${row.storeId}` }}</template></el-table-column>
          <el-table-column label="审核状态">
            <template #default="{ row }">
              <el-tag :type="row.reviewed ? 'success' : 'warning'">{{ row.reviewed ? '已审核' : '待审核' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-permission="['OWNER','MANAGER']" link type="primary" @click="openEdit(row)">修改</el-button>
              <el-button v-permission="['OWNER']" link type="success" @click="review(row)">
                {{ row.reviewed ? '取消审核' : '审核' }}
              </el-button>
              <el-button v-permission="['OWNER']" link type="danger" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="panel"><FinanceChart type="pie" title="分类统计" :labels="categoryLabels" :values="categoryValues" /></div>
      <div class="panel"><FinanceReport /></div>
    </div>
    <el-drawer v-model="formVisible" :title="editing ? '修改账目' : '记账表单'">
      <FinanceForm :key="editing?.id ?? 'new'" :transaction="editing" :loading="saving" @submit="save" />
      <el-alert v-if="saveError" class="save-error" type="error" :title="saveError" show-icon :closable="false" />
    </el-drawer>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AppLayout from '@/components/layout/AppLayout.vue';
import StoreSelector from '@/components/common/StoreSelector.vue';
import FinanceChart from '@/components/common/FinanceChart.vue';
import FinanceForm from './FinanceForm.vue';
import FinanceReport from './FinanceReport.vue';
import { TransactionCategoryLabel, TransactionTypeLabel } from '@/constants/enums';
import { useTransactionStore } from '@/stores/transactionStore';
import { createTransaction, updateTransaction, reviewTransaction, deleteTransaction } from '@/api/transaction';
import { usePermission } from '@/hooks/usePermission';
import { money } from '@/utils/format';
import type { Transaction } from '@/types/transaction';

const router = useRouter();
const { isOwner } = usePermission();
const transactions = useTransactionStore();
const filters = reactive<Record<string, unknown>>({});
const formVisible = ref(false);
const saving = ref(false);
const saveError = ref('');
const editing = ref<Transaction | null>(null);
const categoryLabels = computed(() => Object.values(TransactionCategoryLabel));
const categoryValues = computed(() => Object.keys(TransactionCategoryLabel).map((key) => transactions.list.filter((item) => item.category === key).reduce((sum, item) => sum + Number(item.amount), 0)));

async function load() {
  await transactions.load(filters);
}

function openCreate() {
  editing.value = null;
  saveError.value = '';
  formVisible.value = true;
}

function openEdit(row: Transaction) {
  editing.value = row;
  saveError.value = '';
  formVisible.value = true;
}

function goLogs() {
  router.push('/finance/audit-logs');
}

/** 保存（记账/修改）：成功后关闭抽屉；失败必须明确提示，且保留表单不关闭，避免内容丢失。 */
async function save(payload: Record<string, unknown>) {
  saving.value = true;
  saveError.value = '';
  try {
    if (editing.value) {
      await updateTransaction(editing.value.id, payload);
      ElMessage.success('修改成功');
    } else {
      await createTransaction(payload);
      ElMessage.success('记账成功');
    }
    formVisible.value = false;
    await load();
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '保存失败，账目未变动，请重试';
    saveError.value = `保存失败：${message}。账目未发生变动，请修正后重试。`;
    ElMessage.error(saveError.value);
  } finally {
    saving.value = false;
  }
}

async function review(row: Transaction) {
  try {
    await reviewTransaction(row.id, !row.reviewed);
    ElMessage.success(row.reviewed ? '已取消审核' : '审核通过');
    await load();
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '审核失败，状态未变动';
    ElMessage.error(message);
  }
}

async function remove(row: Transaction) {
  try {
    await ElMessageBox.confirm(`确定删除该账目（${row.date} ${money(row.amount)}）？删除操作会记入操作日志。`, '删除确认', { type: 'warning' });
    await deleteTransaction(row.id);
    ElMessage.success('删除成功');
    await load();
  } catch (error) {
    if (error === 'cancel') return;
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '删除失败，账目未变动';
    ElMessage.error(message);
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

.title-actions {
  display: flex;
  gap: 12px;
}

.save-error {
  margin-top: 16px;
}
</style>

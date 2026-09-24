<template>
  <el-form :model="form" label-width="88px" @submit.prevent>
    <el-form-item label="类型">
      <el-segmented v-model="form.type" :options="[{label:'收入',value:'INCOME'},{label:'支出',value:'EXPENSE'}]" />
    </el-form-item>
    <el-form-item label="分类">
      <el-select v-model="form.category">
        <el-option v-for="(label, value) in TransactionCategoryLabel" :key="value" :label="label" :value="value" />
      </el-select>
    </el-form-item>
    <el-form-item label="金额"><el-input-number v-model="form.amount" :min="0" /></el-form-item>
    <el-form-item label="门店"><StoreSelector :model-value="form.storeId as number" @change="(value) => form.storeId = Number(value)" /></el-form-item>
    <el-form-item label="员工 ID"><el-input-number v-model="form.relatedEmployeeId" :min="1" /></el-form-item>
    <el-form-item label="日期"><el-date-picker v-model="form.date" value-format="YYYY-MM-DD" /></el-form-item>
    <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
    <el-button type="primary" :loading="loading" @click="$emit('submit', { ...form })">
      {{ transactionId ? '保存修改' : '保存记录' }}
    </el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import StoreSelector from '@/components/common/StoreSelector.vue';
import { TransactionCategoryLabel } from '@/constants/enums';
import type { Transaction } from '@/types/transaction';

const props = defineProps<{
  transaction?: Transaction | null;
  loading?: boolean;
}>();

defineEmits<{ submit: [Record<string, unknown>] }>();

const transactionId = props.transaction?.id;

const form = reactive<Record<string, unknown>>({
  type: props.transaction?.type ?? 'INCOME',
  category: props.transaction?.category ?? 'SALES',
  amount: props.transaction ? Number(props.transaction.amount) : 1000,
  description: props.transaction?.description ?? '',
  relatedEmployeeId: props.transaction?.relatedEmployeeId ?? null,
  storeId: props.transaction?.storeId ?? 1,
  date: props.transaction?.date ?? new Date().toISOString().slice(0, 10)
});
</script>

<template>
  <el-select v-model="value" :multiple="multiple" clearable filterable placeholder="选择门店" @change="$emit('change', value)">
    <el-option v-for="store in stores.list" :key="store.id" :label="store.name" :value="store.id" />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useStoreStore } from '@/stores/storeStore';

const props = withDefaults(defineProps<{ multiple?: boolean; defaultValue?: number }>(), { multiple: false, defaultValue: undefined });
defineEmits<{ change: [number | number[] | undefined] }>();

const stores = useStoreStore();
const value = ref<number | number[] | undefined>(props.defaultValue);
onMounted(() => stores.load());
</script>

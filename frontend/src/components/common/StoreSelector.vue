<template>
  <el-select v-model="selected" :multiple="multiple" clearable filterable placeholder="选择门店" @change="$emit('change', selected)">
    <el-option v-for="store in stores.list" :key="store.id" :label="store.name" :value="store.id" />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useStoreStore } from '@/stores/storeStore';

const props = withDefaults(defineProps<{ multiple?: boolean; modelValue?: number | number[] }>(), { multiple: false });
const emit = defineEmits<{ change: [number | number[] | undefined]; 'update:modelValue': [number | number[] | undefined] }>();

const stores = useStoreStore();
const selected = ref<number | number[] | undefined>(props.modelValue);

watch(selected, (value) => emit('update:modelValue', value));
watch(() => props.modelValue, (value) => { selected.value = value; });

onMounted(() => stores.load());
</script>

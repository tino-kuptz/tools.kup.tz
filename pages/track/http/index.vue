<script setup>
const { t } = useI18n();

useCustomI18nHead({
    title: t('pages.track.http.title'),
})

const router = useRouter();

onMounted(() => {
    const uuid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    router.replace(`/track/http/${uuid}`);
});
</script>

<template>
    <div>
        <VProgressCircular indeterminate color="primary" class="me-1" />
        {{ t('common.redirecting') }}
    </div>
</template>

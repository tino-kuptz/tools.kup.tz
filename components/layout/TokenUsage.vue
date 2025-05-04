<script setup>
const tokenStore = useTokenStore();

const getUsagedPercentage = () => {
    const total = tokenStore.token && tokenStore.token.limit ? tokenStore.token.limit : 1;
    const used = tokenStore.token && tokenStore.token.used ? tokenStore.token.used : 1;
    return ((used / total) * 100).toFixed(2);
};

const theToggleButton = ref(null);
const popupOffset = ref({ top: 0, right: 0 });
const recalculatePopupOffset = () => {
    if (theToggleButton.value) {
        console.log({ value: theToggleButton.value });
        const rect = theToggleButton.value.getBoundingClientRect();
        popupOffset.value.top = (rect.top + window.scrollY + rect.height + 5) + 'px';
        popupOffset.value.right = (window.innerWidth - rect.right - rect.width) + 'px';
        console.log('Popup offset:', popupOffset.value);
    } else {
        console.error('theToggleButton is not defined');
    }
};
const popupVisible = ref(false);
const togglePopup = () => {
    popupVisible.value = !popupVisible.value;
    recalculatePopupOffset();
};
</script>
<template>
    <IconBtn class="me-2" @click="togglePopup">
        <div ref="theToggleButton" class="gauge-container">
            <svg class="gauge" viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="gauge-fill" :d="`M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831`" :stroke-dasharray="`${getUsagedPercentage()}, 100`" />
            </svg>
            <div class="gauge-text">{{ Math.round(getUsagedPercentage()) }}%</div>
        </div>
    </IconBtn>
    <div class="popup" v-if="popupVisible" :style="popupOffset">
        <p>
            <strong>Tokenverbrauch</strong>
        </p>
        <p>
            <strong>Tokens benutzt</strong><br>
            {{ tokenStore.token && tokenStore.token.used ? tokenStore.token.used : 0 }} von
            {{ tokenStore.token && tokenStore.token.limit ? tokenStore.token.limit : 0 }}
        </p>
        <p>
            <strong>Tokens verfügbar</strong><br>
            {{ tokenStore.token && tokenStore.token.remaining ? tokenStore.token.remaining : 0 }}
        </p>
        <RouterLink to="/about">Erklärung zu Tokens</RouterLink>
    </div>
</template>
<style scoped>
.gauge-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    height: 100%;
    width: 100%;
}

.gauge {
    transform: rotate(-90deg);
    width: 100%;
    height: 100%;
}

.gauge-bg {
    fill: none;
    stroke: #e6e6e6;
    stroke-width: 2.8;
}

.gauge-fill {
    fill: none;
    stroke: #00aaff;
    stroke-width: 2.8;
    stroke-linecap: round;
    transition: stroke-dasharray 0.3s ease;
}

.gauge-text {
    position: absolute;
    font-size: 0.8em;
    font-weight: bold;
    color: #333;
}

.popup {
    position: fixed;
    width: 250px;
    max-width: 80%;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 16px;
}
</style>

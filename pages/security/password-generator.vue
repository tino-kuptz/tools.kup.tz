<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

useHead({
    title: 'Kennwort Generator',
    meta: [
        {
            description: 'Erstellt sichere Kennwörter basierend auf benutzerdefinierten Vorlagen.',
        },
    ],
})

const currentTemplate = reactive({
    avoidSimilarChars: false,
    length: 12,
    passwordCount: 1,
    numbers: 'allow', // 'require', 'allow', 'forbid'
    lowercase: 'require',
    uppercase: 'allow',
    normalSpecial: 'allow',
    extendedSpecial: 'forbid'
})

const generatedPasswords = ref([])
const showPasswords = ref(false)

// Verschiedene Kategorien
const numbers = '0123456789'
const lowercase = 'abcdefghijklmnopqrstuvwxyz'
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const normalSpecial = '-/:()&".?!'
const extendedSpecial = '<>$€$|{}[]\\^`~'

// Ähnliche Zeichen, die vermieden werden sollen
const similarChars = {
    'l': '1',
    '1': 'l',
    'I': '1',
    '1': 'I',
    'O': '0',
    '0': 'O',
    'S': '5',
    '5': 'S',
    'Z': '2',
    '2': 'Z'
}

// Letzte Einstellungen aus localStorage laden
onMounted(() => {
    const savedSettings = localStorage.getItem('passwordGeneratorSettings')
    if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        Object.assign(currentTemplate, settings)
    }
})



// Vorlagenanforderungen validieren
const validateTemplate = computed(() => {
    const requiredCategories = [
        currentTemplate.numbers === 'require',
        currentTemplate.lowercase === 'require',
        currentTemplate.uppercase === 'require',
        currentTemplate.normalSpecial === 'require',
        currentTemplate.extendedSpecial === 'require'
    ].filter(Boolean).length

    // Prüfen, ob mindestens eine Kategorie erlaubt ist
    const allowedCategories = [
        currentTemplate.numbers === 'allow' || currentTemplate.numbers === 'require',
        currentTemplate.lowercase === 'allow' || currentTemplate.lowercase === 'require',
        currentTemplate.uppercase === 'allow' || currentTemplate.uppercase === 'require',
        currentTemplate.normalSpecial === 'allow' || currentTemplate.normalSpecial === 'require',
        currentTemplate.extendedSpecial === 'allow' || currentTemplate.extendedSpecial === 'require'
    ].filter(Boolean).length

    return {
        isValid: requiredCategories <= currentTemplate.length && allowedCategories > 0,
        requiredCategories,
        availableLength: currentTemplate.length,
        allowedCategories
    }
})

const { $toast } = useNuxtApp()

// Ein einzelnes Kennwort generieren
const generateSinglePassword = () => {

    // In dieses Array werden alle Zeichen des Kennworts gespeichert
    // Am Ende wird das Kennwort gemischt, damit die erforderlichen Zeichen nicht zwangsweise am Anfang stehen
    const password = []

    // Erforderliche Zeichen
    if (currentTemplate.numbers === 'require') {
        let charSet = numbers
        if (currentTemplate.avoidSimilarChars) {
            charSet = charSet.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
        }
        const char = getRandomChar(charSet)
        password.push(char)
    }
    if (currentTemplate.lowercase === 'require') {
        let charSet = lowercase
        if (currentTemplate.avoidSimilarChars) {
            charSet = charSet.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
        }
        const char = getRandomChar(charSet)
        password.push(char)
    }
    if (currentTemplate.uppercase === 'require') {
        let charSet = uppercase
        if (currentTemplate.avoidSimilarChars) {
            charSet = charSet.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
        }
        const char = getRandomChar(charSet)
        password.push(char)
    }
    if (currentTemplate.normalSpecial === 'require') {
        let charSet = normalSpecial
        if (currentTemplate.avoidSimilarChars) {
            charSet = charSet.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
        }
        const char = getRandomChar(charSet)
        password.push(char)
    }
    if (currentTemplate.extendedSpecial === 'require') {
        let charSet = extendedSpecial
        if (currentTemplate.avoidSimilarChars) {
            charSet = charSet.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
        }
        const char = getRandomChar(charSet)
        password.push(char)
    }

    // Mit optionalen Zeichen auffüllen, indem wir erst einen String mit allen 
    // optionalen/erforderlichen Zeichen erstellen...
    let charPool = ''
    if (currentTemplate.numbers === 'allow' || currentTemplate.numbers === 'require') {
        charPool += numbers
    }
    if (currentTemplate.lowercase === 'allow' || currentTemplate.lowercase === 'require') {
        charPool += lowercase
    }
    if (currentTemplate.uppercase === 'allow' || currentTemplate.uppercase === 'require') {
        charPool += uppercase
    }
    if (currentTemplate.normalSpecial === 'allow' || currentTemplate.normalSpecial === 'require') {
        charPool += normalSpecial
    }
    if (currentTemplate.extendedSpecial === 'allow' || currentTemplate.extendedSpecial === 'require') {
        charPool += extendedSpecial
    }

    // ... ggfs. ähnliche Zeichen entfernen...
    if (currentTemplate.avoidSimilarChars) {
        charPool = charPool.split('').filter(char => !Object.keys(similarChars).includes(char)).join('')
    }

    // ... und das Kennwort dann mit den restlichen Zeichen auffüllen
    const remainingLength = currentTemplate.length - password.length
    for (let i = 0; i < remainingLength; i++) {
        const char = getRandomChar(charPool)
        password.push(char)
    }

    // Nun mischen wir das Kennwort, damit die erforderlichen Zeichen nicht zwangsweise am Anfang stehen
    const shuffledPassword = shuffleArray(password)
    return shuffledPassword.join('')
}

// Generieren aller Kennwörter
const generatePasswords = async () => {
    if (!validateTemplate.value.isValid) {
        if (validateTemplate.value.allowedCategories === 0) {
            $toast.error('Mindestens eine Zeichenkategorie muss erlaubt sein.', {
                position: "bottom-center",
            })
        } else {
            $toast.error(`${validateTemplate.value.requiredCategories} Kategorien sind erforderlich, aber das Kennwort hat nur ${validateTemplate.value.availableLength} Zeichen.`, {
                position: "bottom-center",
            })
        }
        return
    }

    const passwords = []
    for (let i = 0; i < currentTemplate.passwordCount; i++) {
        const password = generateSinglePassword()
        if (password) {
            passwords.push(password)
        }
    }

    generatedPasswords.value = passwords
    showPasswords.value = true
}

// Zufälliges Zeichen mit WebCrypto erhalten
const getRandomChar = (charSet) => {
    const array = new Uint8Array(1)
    crypto.getRandomValues(array)
    return charSet[array[0] % charSet.length]
}

// Array mit WebCrypto mischen
const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const array2 = new Uint8Array(1)
        crypto.getRandomValues(array2)
        const j = array2[0] % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

// Aktuelle Einstellungen speichern
const saveSettings = () => {
    localStorage.setItem('passwordGeneratorSettings', JSON.stringify(currentTemplate))
}

// Einstellungen automatisch speichern, wenn sie sich ändern
watch(currentTemplate, () => {
    saveSettings()
}, { deep: true })



// Kennwort in die Zwischenablage kopieren
const copyPassword = async (password) => {
    try {
        await navigator.clipboard.writeText(password)
        $toast.success('Kennwort wurde in die Zwischenablage kopiert', {
            position: "bottom-center",
        })
    } catch (err) {
        $toast.error('Fehler beim Kopieren des Kennworts: ' + err.message, {
            position: "bottom-center",
        })
    }
}

const { global: theme } = useTheme()

// Zeichenfarbe für die Anzeige erhalten
const getCharColor = (char) => {
    const isDark = theme.current.value.dark

    if (numbers.includes(char)) {
        return { color: isDark ? '#90CAF9' : '#1976D2' } // Hellblau im Dark Mode, Dunkelblau im Light Mode
    }
    if (normalSpecial.includes(char) || extendedSpecial.includes(char)) {
        return { color: isDark ? '#EF5350' : '#D32F2F' } // Hellrot im Dark Mode, Dunkelrot im Light Mode
    }
    return { color: isDark ? '#E0E0E0' : '#424242' } // Hellgrau im Dark Mode, Dunkelgrau im Light Mode
}
</script>

<template>
    <div>
        <h1 class="mb-4">Kennwort-Generator</h1>

        <VCard color="secondary" variant="elevated" class="mb-4">
            <VCardItem>
                <div>
                    <div class="text-overline mb-2">
                        Über dieses Tool
                    </div>
                    <div class="text-h6 mb-1">
                        Das Tool kann genutzt werden, um Kennwörter zu generieren. Die Kennwörter werden im Browser
                        generiert, zur Generierung wird WebCrypto genutzt.
                    </div>
                    <div class="text-h6 mb-1">
                        Die Kennwörter werden nicht an den Server übermittelt oder auf diesem gespeichert.
                    </div>
                </div>
            </VCardItem>
        </VCard>

        <VCard>
            <VCardText>
                <VRow>
                    <VCol cols="12" md="6">
                        <h3 class="mb-4">Vorlage bearbeiten</h3>

                        <VSwitch v-model="currentTemplate.avoidSimilarChars"
                            label="Ähnliche Zeichen vermeiden (l/1, O/0, etc.)" class="mb-4" />

                        <VSlider v-model="currentTemplate.length" :label="`Länge (${currentTemplate.length} Zeichen)`"
                            :min="4" :max="64" :step="1" show-ticks class="mb-4" />

                        <VSlider v-model="currentTemplate.passwordCount"
                            :label="`Anzahl Kennwörter (${currentTemplate.passwordCount})`" :min="1" :max="10" :step="1"
                            show-ticks class="mb-4" />

                        <h4 class="mb-2">Zeichenkategorien</h4>

                        <VSelect v-model="currentTemplate.numbers" label="Zahlen" :items="[
                            { title: 'Erzwingen', value: 'require' },
                            { title: 'Erlauben, aber nicht erzwingen', value: 'allow' },
                            { title: 'Nicht erlauben', value: 'forbid' }
                        ]" variant="outlined" class="mb-3" />

                        <VSelect v-model="currentTemplate.lowercase" label="Kleine Buchstaben" :items="[
                            { title: 'Erzwingen', value: 'require' },
                            { title: 'Erlauben, aber nicht erzwingen', value: 'allow' },
                            { title: 'Nicht erlauben', value: 'forbid' }
                        ]" variant="outlined" class="mb-3" />

                        <VSelect v-model="currentTemplate.uppercase" label="Große Buchstaben" :items="[
                            { title: 'Erzwingen', value: 'require' },
                            { title: 'Erlauben, aber nicht erzwingen', value: 'allow' },
                            { title: 'Nicht erlauben', value: 'forbid' }
                        ]" variant="outlined" class="mb-3" />

                        <VSelect v-model="currentTemplate.normalSpecial"
                            label="Normale Sonderzeichen (-/:()&amp;&quot;.?!)" :items="[
                                { title: 'Erzwingen', value: 'require' },
                                { title: 'Erlauben, aber nicht erzwingen', value: 'allow' },
                                { title: 'Nicht erlauben', value: 'forbid' }
                            ]" variant="outlined" class="mb-3" />

                        <VSelect v-model="currentTemplate.extendedSpecial"
                            label="Erweiterte Sonderzeichen (<>$€$|{}[]\\^`~)" :items="[
                                { title: 'Erzwingen', value: 'require' },
                                { title: 'Erlauben, aber nicht erzwingen', value: 'allow' },
                                { title: 'Nicht erlauben', value: 'forbid' }
                            ]" variant="outlined" class="mb-3" />



                        <div class="d-flex gap-2">
                            <VBtn @click="generatePasswords" color="success"
                                :class="{ 'opacity-50': !validateTemplate.isValid }">
                                Generieren
                            </VBtn>
                        </div>
                    </VCol>

                    <VCol cols="12" md="6">
                        <h3 class="mb-4">Generierte Kennwörter</h3>
                        <div class="text-body-2 mb-2">
                            <span :style="getCharColor('a')">Buchstaben</span>,
                            <span :style="getCharColor('0')">Zahlen</span> und
                            <span :style="getCharColor('!')">Sonderzeichen</span> haben eine andere Farbe.
                        </div>

                        <div v-if="showPasswords">
                            <div v-if="generatedPasswords.length <= 3">
                                <VCard v-for="(password, index) in generatedPasswords" :key="index" variant="outlined"
                                    class="mb-3">
                                    <VCardText>
                                        <div class="text-h6 font-mono">
                                            <span v-for="(char, charIndex) in password" :key="charIndex"
                                                :style="getCharColor(char)">
                                                {{ char }}
                                            </span>
                                        </div>
                                    </VCardText>
                                    <VCardActions>
                                        <VBtn @click="copyPassword(password)" variant="text">
                                            <VIcon icon="bx-copy" class="me-2" />
                                            Kopieren
                                        </VBtn>
                                    </VCardActions>
                                </VCard>
                            </div>

                            <div v-else>
                                <VCard variant="outlined">
                                    <VCardText>
                                        <div class="d-flex flex-wrap gap-2">
                                            <div v-for="(password, index) in generatedPasswords" :key="index"
                                                class="d-flex align-center gap-2 pa-2 rounded border">
                                                <div class="text-body-1 font-mono">
                                                    <span v-for="(char, charIndex) in password" :key="charIndex"
                                                        :style="getCharColor(char)">
                                                        {{ char }}
                                                    </span>
                                                </div>
                                                <VBtn @click="copyPassword(password)" variant="text" size="small">
                                                    <VIcon icon="bx-copy" size="small" />
                                                </VBtn>
                                            </div>
                                        </div>
                                    </VCardText>
                                </VCard>
                            </div>
                        </div>

                        <VAlert v-else type="info">
                            Klicke auf "Kennwörter generieren", um Kennwörter zu erstellen.
                        </VAlert>
                    </VCol>
                </VRow>
            </VCardText>
        </VCard>
    </div>
</template>

<style scoped>
.font-mono {
    font-family: 'Courier New', monospace;
    letter-spacing: 2px;
}
</style>

<script setup>
//import { get_tools_categories, get_tools_bycategory } from '@/api/tools'
useHead({
    title: 'Über diese Seite',
    meta: [
        {
            description: 'Was tools.kup.tz ausmacht, warum es diese Seite gibt, usw.',
        },
    ],
})
</script>

<template>
    <div>
        <VCard title="Über diese Seite">
            <VCardText>
                Diese Webseite dient als zentrale Anlaufstelle für eine Sammlung von Werkzeugen, die ich im Laufe der
                Zeit entwickelt habe. Sie wurde ins Leben gerufen, um meine Projekte und Ideen an einem Ort zu bündeln
                und zugänglich zu machen.
            </VCardText>
            <VCardText>
                Die Inhalte dieser Seite werden kontinuierlich erweitert und aktualisiert, wobei der Fokus darauf liegt,
                nützliche Lösungen bereitzustellen. Es kann jedoch vorkommen, dass die Seite zeitweise unvollständig
                oder leer erscheint – dies ist ein natürlicher Teil des Entwicklungsprozesses, passende Werkzeuge
                programmiere ich nur, wenn ich sie benötige.
            </VCardText>
            <VCardText>
                Wenn Fragen oder Anregungen da sind, zögere bitte nicht, mich zu kontaktieren.
            </VCardText>
            <VCardText>
                Übrigens: diese Seite ist komplett Serverless auf Cloudflare Pages gehostet und nutzt die
                Funktionen von Cloudflare, um die Werkzeuge bereitzustellen.
            </VCardText>
            <VCardText>
                Vielen Dank für Ihr Interesse und Ihre Geduld!
            </VCardText>

            <VCardActions>
                <VBtn @click="location.href = 'mailto:tino@kup.tz'">
                    Kontakt
                    <VIcon icon="bx-envelope" class="ms-2" />
                </VBtn>
            </VCardActions>
        </VCard>
    </div>
</template>

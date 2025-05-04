<script setup>
useHead({
    title: 'Über diese Seite',
    meta: [
        {
            description: 'Was tools.kup.tz ausmacht, warum es diese Seite gibt, usw.',
        },
    ],
})

import { useTokenStore } from '../stores/tokens.js'
const tokenStore = useTokenStore()
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
        </VCard>


        <VCard class="mt-4" title="Über Tokens" id="tokens">
            <VCardText>
                Diese Webseite verwendet Tokens, um die Nutzung der verschiedenen Werkzeuge zu steuern. Tokens sind eine
                Art von virtuellem Guthaben, das Ihnen zur Verfügung steht, um die Funktionen der Seite zu nutzen. Bei
                einigen Werkzeugen, die serverseitige Verarbeitung erfordern, werden Tokens verbraucht. Dies hilft,
                die Serverlast zu steuern und sicherzustellen, dass die Seite nicht überlastet wird.
            </VCardText>
            <VCardText>
                Die Tokens sollen ebenfalls Missbrauch verhindern. Immerhin bin ich der Betreiber dieser Seite und
                damit auch der Rechnungsempfänger seitens Cloudflare.
            </VCardText>
            <VCardText>
                Es gibt keine Möglichkeit, Tokens zu kaufen oder zu erhöhen. Die Tokens werden automatisch
                generiert und sind für jeden Benutzer gleich. Die Tokens sind pro IP-Subnetz gültig, sodass du
                deine Token pro Internetverbindung, und nicht pro Gerät, erhältst. Das bedeutet auch, dass du
                Tokens mit anderen Benutzern teilen kannst, die sich im selben Subnetz befinden. Aus diesem Grund
                zeige ich nirgendswo, wie die Tokens eines Subnetzes verbraucht werden.
            </VCardText>
            <VCardText>
                Tokens resetten sich täglich um 00:00 Uhr UTC. Das bedeutet, dass du jeden Tag eine neue
                Menge an Tokens zur Verfügung haben, um die Werkzeuge zu nutzen. Wenn du deine Tokens
                aufgebraucht hast, kannst du einfach warten, bis der nächste Tag beginnt, um wieder Zugriff auf die
                Funktionen zu erhalten.
            </VCardText>
            <VCardText>
                Diese Seite ist Open Source. Wenn du mal mehr Tokens brauchst, als du pro Tag bekommst, kannst du
                sie auch selber hosten und die Token-Limits anpassen. Der Quellcode ist auf GitHub verfügbar.
            </VCardText>
            <VCardText>
                Aktuell befindest du dich im Subnetz <strong>{{ tokenStore.token.ip }}</strong>.<br>
                Dein Subnetz hat <strong>{{ tokenStore.token.limit }}</strong> Tokens zur Verfügung. Davon sind
                <strong>{{ tokenStore.token.used }}</strong> Tokens bereits verbraucht und noch
                <strong>{{ tokenStore.token.remaining }}</strong> Tokens verfügbar.
            </VCardText>
        </VCard>
    </div>
</template>

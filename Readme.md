# tools.kup.tz

Eine serverlose Webseite mit diversen Tools, gehostet auf Cloudflare.

## Motivation

Hin und wieder gibt es einige Sachen, die ich händisch mache, die mit Programm allerdings viel schneller wären. Ein Beispiel: herausfinden, bei welchem Anbieter nun genau noch mal eine Webseite liegt.

Da sich solche Sachen häufen, habe ich entschieden, hierfür eine Tools-Webseite zu bauen. Wenn ich ein Tool benötige, welches sich hier reindumpen lässt, kommt das hier rein.

## Mitarbeit

Wenn jemand nice Tools hat, kann ich die gerne mit reinmischen. Dafür einfach nen Merge Request stellen.

Ich weise jetzt schon mal darauf hin, dass ich nicht die Zeit habe, mich immer direkt um alles zu kümmern. Es kann also durchaus sein, dass ihr etwas warten müsst, bis ich mich zurück melde.

## Initiale Projektphase

Ich nehme dieses Projekt nicht so 100% ernst. Bitte seht mir nach, wenn ich (gerade in der Anfangszeit) ein Commit mit 30 geänderten Dateien und <code>fdsajkhfdsakf</code> als Beschreibung reinhaue.

## Technisches Geplänkel

Infos, um das Projekt schnell zu blicken.

### Hosting

Das Hosting liegt bei Cloudflare Pages. 

In Hintergrund ist eine D1-Datenbank angebunden.

Das Schema für diese findet sich in `db.sql`.

### Tokens

Da einige Tools Servercode benötigen, und ich der Idiot bin dessen Name oben auf der Rechnung steht, nutzt dieses Tool anonymisierte IP-Adressen um Verbräuche zu trocken.

Jedes IP-Subnetz (IPv4: /28, IPv6: /104) hat pro Tag 1.000 "Tokens", die verwendet werden können.<br>Einzelne API-Endpunkte verbrauchen unterschiedlich viele Tokens.

Wenn jemand sich das selber hosten möchte und an der Logik rumspielen möchte: In `server/utils/usage.js` ist die Logik zum Sammeln und Auswerten der Punkte.<br>
In `utils/toolList.js` ist die primäre Tool-Liste (aus der auch die Sidebar und die Startseite generiert wird) - aus dieser werden auch die Tokens serverseitig beim Tracken genommen.

### Externe Projekte

Zu diesem Projekt gehört ebenfalls das Projekt [tino-kuptz/397625878.xyz](https://github.com/tino-kuptz/397625878.xyz). Das wird im HTTP-Log-Tool genutzt, und protokolliert HTTP-Requests an `*.397625878.xyz`.

## Template

Das folgende Template wird für dieses Projekt genutzt:<br>
https://github.com/themeselection/sneat-vuetify-nuxtjs-admin-template-free

# ALCATRAZ · 1962 — "Would you have tried?"

Estado: **preparado, pendiente de render en el PC** (plantilla gladiator_render_pc).
Al retomar: copiar `data/voice.mp3` y `data/words.json` a `archive404_studio\alcatraz_render_pc\data\`,
crear `r3d/alca/` a partir de `r3d/glad/` (chars.js, mocap.js, world.js) y escribir `alcatraz.js` + `main.js` con los planos de abajo.

## Parámetros de render (render_all.py)
- Voz: Aiden (VUwOgZd7gm6WtO89ZaDg), eleven_multilingual_v2 — 51,36 s
- `DUR = 53.6; FPS = 60; SUB = 4; OUTRO = 51.6; COVER_T ≈ 37.5` (plano de la cama con la cabeza falsa)
- Salida: `alcatraz.mp4`, 1080x1920
- Portada (make_cover.py): `"ALCATRAZ · 1962"`, `"WOULD YOU"`, `"ESCAPE"`, `"THE ROCK?"`

## Guion (con timings)
| t (s) | Texto | Plano |
|---|---|---|
| 0,0–3,7 | Alcatraz. 1962. | Aéreo nocturno de la isla con niebla, faro girando, luces de San Francisco al fondo, olas rompiendo en las rocas. Dolly lento hacia el bloque de celdas. Rótulo "1962". |
| 3,7–5,5 | Your cell is five feet by nine. | Cenital dentro de la celda (1,5 × 2,7 m): catre, lavabo, retrete sin tapa, estante, mesita plegable. Cotas animadas "5 ft / 9 ft" (1.5 m / 2.7 m). |
| 6,0–8,6 | Stretch your arms… you touch both walls. | Protagonista (uniforme azul, número 1441) de pie, abre los brazos y toca ambas paredes con las palmas (contacto real, sin atravesar). |
| 9,2–10,3 | Lights out at 9:30. | Pasillo "Broadway" del bloque B/C, tres pisos de celdas; las luces se apagan en cascada. Reloj de pared 9:30. |
| 10,4–12,7 | The guards count you 13 times a day. | Guardia con linterna pasa por delante de la reja; haz de luz barre la cara del protagonista. Contador "13" superpuesto. |
| 13,0–17,2 | All around you: 50°F water, currents that drag men out to sea. | Exterior: agua oscura, flechas de corriente hacia el Golden Gate. Termómetro "50°F / 10 °C". Un stickman manoteando arrastrado por la corriente. |
| 18,0–19,3 | Nobody escapes the Rock. | Torre de vigilancia con guardia armado y foco; muro con alambre de espino. |
| 19,8–20,5 | So you dig. | Vuelta a la celda: el protagonista se arrodilla junto a la rejilla de ventilación bajo el lavabo. |
| 21,0–25,0 | Every night, with a sharpened spoon, you scrape the concrete around your air vent. | Primer plano de manos: cuchara raspando el cemento, polvo cayendo, la rejilla se afloja. Vela/linterna tenue. Acordeón tapando el agujero. |
| 25,6–30,8 | You build a fake head out of soap, toilet paper… and real hair from the barbershop. | Montaje: pastilla de jabón + papel higiénico moldeados, pintura color piel, mechones de pelo pegados. Inserto de la barbería (silla, tijeras, pelo en el suelo). |
| 31,9–34,1 | You glue 50 raincoats into a raft. | Pasillo de servicios tras las celdas, tuberías; balsa amarilla de impermeables cosidos, chalecos salvavidas, remos de madera. Contador "50". |
| 34,8–35,6 | June eleventh. | Calendario arrancado: JUNE 11, 1962. |
| 36,2–37,8 | You leave the dummy in your bed… | La cabeza falsa sobre la almohada, manta tapando el bulto; la linterna del guardia pasa y no nota nada. (Plano de portada.) |
| 38,3–39,8 | climb the vents to the roof… | Tres stickmans trepando por el conducto de ventilación (mocap de escalada), salen al tejado bajo la luz del faro. |
| 40,3–41,7 | and paddle into the dark. | La balsa en el agua negra, tres remando, niebla, la isla alejándose. |
| 42,8–45,5 | Next morning, the guards find only the heads. | Amanecer; un guardia levanta la manta, la cabeza falsa rueda al suelo. Sirena, luces rojas. |
| 46,3–47,5 | No bodies were ever found. | Restos de la balsa / un remo flotando junto a Angel Island; huellas en la arena. |
| 47,8–49,8 | Nobody knows if they made it. | Plano abierto del agua con niebla; pantalla de expediente FBI "CASE: UNSOLVED". |
| 50,2–51,4 | So… would you have tried? | Primer plano del protagonista en la celda mirando a cámara. |
| 51,6–53,6 | — | Outro de Null (estándar). |

## Escenarios (alcatraz.js) — muy detallados
- Isla: roca, edificio de celdas, faro, torre de agua, muelle, niebla volumétrica, mar con oleaje animado, skyline de SF con luces y Golden Gate a lo lejos.
- Bloque de celdas: 3 pisos, barandillas, escaleras, rejas con barrotes individuales, pasillo central, ventanales altos, reloj.
- Celda: catre con manta gris, lavabo, retrete, estantes con libros, rejilla de ventilación, acordeón.
- Pasillo de servicios: tuberías, cables, conducto vertical hasta el tejado.
- Barbería, torre de vigilancia, playa de Angel Island.

## Personajes y animaciones (ver ANIMACIONES.md en el PC para los nombres exactos)
- Protagonista (Frank Morris): uniforme azul claro, camisa con número. Andar/de pie automáticos; arrodillarse/agacharse para cavar; escalada para el conducto; remar sentado en la balsa.
- Anglin x2: mismo uniforme. Guardias: uniforme gris oscuro, gorra, linterna/fusil.
- Interacciones reales: palmas contra las paredes, cuchara contra el cemento, manos en los remos, guardia levantando la manta.

## Música / SFX
Base tensa y lenta (bed.wav) que crece hacia la fuga; SFX: olas, sirena de niebla, rejas cerrándose, raspado de cuchara, gotas, sirena de alarma, remos en el agua.

## Publicación (Buffer, siguiente hueco libre a las 20:00 España, YouTube + TikTok + Instagram a la vez)
Título YouTube: **Would You Have Tried to Escape Alcatraz? (1962) #shorts**

Texto:
> 1962. Three men, a sharpened spoon and 50 raincoats. Nobody knows if they made it. Would you have tried? 👇
> #alcatraz #history #escape #truecrime #shorts #archive404

## Datos verificados
- Celdas 5 × 9 ft (1,5 × 2,7 m), con catre, lavabo y retrete.
- Luces fuera a las 21:30; recuentos frecuentes cada día.
- Agua de la bahía 50–54 °F (10–12 °C); la noche de la fuga, 54 °F.
- Morris y los hermanos Anglin, 11 de junio de 1962: cucharas afiladas, cabezas de papel maché (jabón, papel higiénico, pintura y pelo real de la barbería), balsa de ~50 impermeables, subida por los conductos al tejado.
- El FBI cerró el caso en 1979 dándolos por muertos; nunca se hallaron los cuerpos.

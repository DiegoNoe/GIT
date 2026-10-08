"use strict";

const {onValueWritten} = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");

initializeApp({
  databaseURL: "https://cremeria-imperial.firebaseio.com",
});

const db = getDatabase();

// Para detenerlo: cambiar a false y desplegar.
const ACTIVADO = true;

const MAX_EDAD_CORRECCION_MS = 120000;

// Memoria independiente de /productos.
// Conservar los registros con recomendado:false para impedir
// que eventos antiguos reactiven una preferencia eliminada.
function combinar(anterior, cambio) {
  const memoria = anterior || {};
  const siguiente = {...memoria};
  const ultimo = memoria.ultimo;

  if (!ultimo || cambio.ms > ultimo.ms) {
    siguiente.ultimo = cambio;
  } else if (
    cambio.ms === ultimo.ms &&
    cambio.id !== ultimo.id
  ) {
    siguiente.revisionManual = true;
  }

  let preferencia;

  // Cualquier estado -> recomendado.
  if (cambio.despues === "recomendado") {
    preferencia = true;
  }

  // Recomendado -> noHay: recordar la recomendación.
  if (
    cambio.antes === "recomendado" &&
[   "noHay", "pedido"].includes(cambio.despues)
  ) {
    preferencia = true;
  }

  // Recomendado -> siHay: quitar la recomendación.
  if (
    cambio.antes === "recomendado" &&
    cambio.despues === "siHay"
  ) {
    preferencia = false;
  }

  // No heredar preferencias si se elimina y recrea el producto.
  if (cambio.despues === null) {
    preferencia = false;
  }

  if (preferencia !== undefined) {
    const decision = memoria.decision;

    if (!decision || cambio.ms > decision.ms) {
      siguiente.decision = {
        ms: cambio.ms,
        id: cambio.id,
        recomendado: preferencia,
      };
    } else if (
      cambio.ms === decision.ms &&
      cambio.id !== decision.id &&
      preferencia !== decision.recomendado
    ) {
      siguiente.revisionManual = true;
    }
  }

  return siguiente;
}

exports.parcheExistencias = onValueWritten(
  {
    ref: "/productos/{productoId}/existencia",
    instance: "cremeria-imperial",
    region: "us-central1",
    maxInstances: 1,
    concurrency: 1,
    retry: true,
  },
  async (event) => {
    const productoId = event.params.productoId;

    if (!ACTIVADO) {
        return;
    }

    const antes = event.data.before.val();
    const despues = event.data.after.val();

    if (antes === despues) {
      return;
    }

    const ms = Date.parse(event.time);

    if (!Number.isFinite(ms)) {
      logger.error("EVENTO_SIN_FECHA", {
        productoId,
        evento: event.id,
      });
      return;
    }

    const cambio = {
      id: event.id,
      ms,
      antes,
      despues,
    };

    const memoriaRef = db.ref(
      `_parcheExistencias/productos/${productoId}`
    );

    const resultado = await memoriaRef.transaction(
      (memoria) => combinar(memoria, cambio),
      undefined,
      false
    );

    const memoria = resultado.snapshot.val();

    logger.info("MEMORIA_ACTUALIZADA", {
      productoId,
      antes,
      despues,
      recomendado: memoria.decision?.recomendado ?? false,
    });

    if (memoria.revisionManual) {
      logger.error("REVISAR_ORDEN_AMBIGUO", {
        productoId,
      });
      return;
    }

    const ultimo = memoria.ultimo;

    // Restaurar únicamente por una transición noHay -> siHay
    // y si conservamos la preferencia de recomendado.
    if (
      !memoria.decision?.recomendado ||
      !["noHay", "pedido"].includes(ultimo.antes) ||
      ultimo.despues !== "siHay" ||
      memoria.intento === ultimo.id
    ) {
      return;
    }

    if (Date.now() - ultimo.ms > MAX_EDAD_CORRECCION_MS) {
      logger.warn("CORRECCION_VENCIDA_REVISAR", {
        productoId,
      });
      return;
    }

    // Una sola tentativa de corrección por transición.
    const reserva = await memoriaRef.transaction(
      (actual) => {
        // La primera llamada puede recibir null por caché vacía.
        // Permitir que Firebase compruebe el valor del servidor.
        if (actual === null) {
          return null;
        }

        if (
          actual.revisionManual ||
          actual.ultimo?.id !== ultimo.id ||
          !actual.decision?.recomendado ||
          actual.intento === ultimo.id
        ) {
          return;
        }

        return {
          ...actual,
          intento: ultimo.id,
        };
      },
      undefined,
      false
    );

    if (!reserva.committed || !reserva.snapshot.exists()) {
      logger.warn("RESERVA_NO_REALIZADA", {
        productoId,
        evento: ultimo.id,
        committed: reserva.committed,
        memoria: reserva.snapshot.val(),
      });
      return;
    }

    logger.info("CORRECCION_INICIADA", {
      productoId,
      evento: ultimo.id,
    });

    const existenciaRef = db.ref(
      `productos/${productoId}/existencia`
    );

    const correccion = await existenciaRef.transaction(
      (actual) => {
        // También manejar caché vacía en esta transacción.
        if (actual === null) {
          return null;
        }

        // No sobrescribir noHay ni ningún otro estado.
        if (actual !== "siHay") {
          return;
        }

        return "recomendado";
      },
      undefined,
      false
    );

    const restaurado =
      correccion.committed &&
      correccion.snapshot.val() === "recomendado";

    logger.info(
      restaurado
        ? "RECOMENDADO_RESTAURADO"
        : "CORRECCION_OMITIDA_ESTADO_CAMBIO",
      {
        productoId,
        evento: ultimo.id,
        estadoFinal: correccion.snapshot.val(),
      }
    );
  }
);

// LIMITES DEL PILOTO:
// - No carga masivamente los recomendados actuales.
// - Aprende al marcar recomendado o al pasar recomendado -> noHay.
// - Sin versiones en las terminales, no garantiza distinguir todos
//   los ciclos rápidos siHay -> otro estado -> siHay.
// - Si falla después de reservar la tentativa, no repite la escritura.
//   CORRECCION_INICIADA sin resultado requiere revisión.
// - La corrección de caché vacía aún debe verificarse en Firebase.
/**
 * OpenTelemetry Node.js instrumentation entry point.
 *
 * Import this file as early as possible (before any other imports) to enable
 * auto-instrumentation of HTTP, database drivers, etc.
 *
 * Usage:
 *   node --import @starter/observe/instrument ./server.js
 *
 * Or in your entry file:
 *   import "@starter/observe/instrument";
 *
 * Configuration via environment variables:
 *   OTEL_ENABLED=true                    — Enable tracing (default: false)
 *   OTEL_EXPORTER_OTLP_ENDPOINT          — OTLP endpoint (default: http://localhost:4318)
 *   OTEL_SERVICE_NAME                     — Service name (default: starter)
 *   OTEL_RESOURCE_ATTRIBUTES              — Additional resource attributes
 *
 * Datadog Agent:
 *   Set OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 and enable
 *   otlp_config.receiver.protocols.http in your DD Agent config.
 *
 * Any OTLP-compatible backend (Grafana, Honeycomb, etc.) works the same way.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const enabled =
  process.env.OTEL_ENABLED === "true" && process.env.NODE_ENV !== "test";

if (enabled) {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "starter",
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "0.0.0",
    "deployment.environment.name": process.env.NODE_ENV || "development",
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${endpoint}/v1/metrics`,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable noisy fs instrumentation
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
      }),
    ],
  });

  sdk.start();

  console.log({
    msg: "OpenTelemetry tracing enabled",
    endpoint,
    service: process.env.OTEL_SERVICE_NAME || "starter",
  });

  // Graceful shutdown
  const shutdown = () => {
    sdk
      .shutdown()
      .then(() => console.log("OpenTelemetry shut down"))
      .catch((err) => console.error("OpenTelemetry shutdown error", err))
      .finally(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

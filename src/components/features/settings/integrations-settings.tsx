"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import {
  IntegrationGrid,
  IntegrationRows,
} from "@/components/features/settings/integrations";
import { SettingsSection } from "@/components/features/settings/settings-section";
import type { ConnectedIntegration } from "@/entities/settings";
import type { Integrations } from "@/services/settings";
import { fade } from "@/styles/motion";

/**
 * Settings, Integrations. Connected services as rows, then what can still be
 * added. Adding one moves it up into the rows; reconnecting turns its status.
 */
export function IntegrationsSettings({
  connected: initialConnected,
  available: initialAvailable,
}: Integrations) {
  const [connected, setConnected] = useState(initialConnected);
  const [available, setAvailable] = useState(initialAvailable);

  function reconnect(id: string) {
    const item = connected.find((candidate) => candidate.id === id);
    if (item === undefined) return;
    setConnected((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              status: "connected",
            }
          : candidate,
      ),
    );
    toast.success(`${item.name} reconnected`);
  }

  function add(id: string) {
    const item = available.find((candidate) => candidate.id === id);
    if (item === undefined) return;
    const row: ConnectedIntegration = {
      ...item,
      status: "connected",
    };
    setAvailable((current) =>
      current.filter((candidate) => candidate.id !== id),
    );
    setConnected((current) => [...current, row]);
    toast.success(`${item.name} connected`);
  }

  return (
    <div className="flex flex-col gap-xxl md:gap-section">
      <SettingsSection
        title="Connected"
        description="What the agent reads from and writes to."
      >
        <AnimatePresence initial={false} mode="popLayout">
          {connected.length === 0 ? (
            <motion.p
              key="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.base}
              className="px-m type-small text-imagine-foreground-muted"
            >
              Nothing connected yet.
            </motion.p>
          ) : (
            <IntegrationRows
              key="rows"
              items={connected}
              onReconnect={reconnect}
            />
          )}
        </AnimatePresence>
      </SettingsSection>

      <AnimatePresence initial={false}>
        {available.length === 0 ? null : (
          <motion.div
            key="available"
            exit={{ opacity: 0, y: 4 }}
            transition={fade.base}
          >
            <SettingsSection title="Available">
              <IntegrationGrid items={available} onAdd={add} />
            </SettingsSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

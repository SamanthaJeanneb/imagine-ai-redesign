"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ApiKeySection } from "@/components/features/settings/api-keys";
import type { ApiKeyData } from "@/services/settings";

const KEY_PREFIX = "imga_";
const KEY_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const KEY_LENGTH = 24;

/** A fresh secret in the mock's key format. */
function issueKey(): string {
  const bytes = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const byte of bytes) {
    body += KEY_ALPHABET.charAt(byte % KEY_ALPHABET.length);
  }
  return `${KEY_PREFIX}${body}`;
}

/**
 * Settings, API. The single workspace key. Rotating and revoking change the
 * key on screen; the facts line reflects what just happened.
 */
export function ApiSettings({ secret: initialSecret, facts }: ApiKeyData) {
  const [key, setKey] = useState<ApiKeyData>({ secret: initialSecret, facts });

  return (
    <div className="w-full max-w-2xl">
      <ApiKeySection
        secret={key.secret}
        facts={key.facts}
        onCreate={() => {
          setKey({
            secret: issueKey(),
            facts: ["Never used", "Created today"],
          });
          toast.success("API key created");
        }}
        onRotate={() => {
          setKey({
            secret: issueKey(),
            facts: ["Never used", "Rotated today"],
          });
          toast.success("API key rotated. Update anything using the old key.");
        }}
        onRevoke={() => {
          setKey({ secret: null, facts: [] });
          toast("API key revoked");
        }}
      />
    </div>
  );
}

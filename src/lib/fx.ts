const FALLBACK_USD_PER_EUR = 1.16;

/** ECB euro-dollar rate, cached for six hours. XAF stays on its euro peg. */
export async function getUsdPerEur() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD", {
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return FALLBACK_USD_PER_EUR;
    const data = (await response.json()) as { rates?: { USD?: number } };
    const rate = Number(data.rates?.USD);
    if (rate > 0.5 && rate < 3) return rate;
  } catch {
    // The peg still converts XAF to EUR. USD uses the fallback until the rate service answers.
  }
  return FALLBACK_USD_PER_EUR;
}

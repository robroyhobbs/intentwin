/**
 * Shared type for Recharts custom tooltip component props.
 *
 * Recharts passes these properties to any component supplied via
 * `<Tooltip content={<MyTooltip />} />`.
 */

export interface RechartsTooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string | number;
  /** The original data object for this data point. */
  payload: Record<string, unknown>;
}

export interface RechartsTooltipProps {
  active?: boolean;
  payload?: RechartsTooltipPayloadEntry[];
  label?: string;
}

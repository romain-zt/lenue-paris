export type FloorStatus = "pass" | "fail" | "blocked" | "skipped";

export interface FloorRow {
  floor_id: string;
  observed: string | number | boolean;
  threshold: string | number | boolean;
  reference_violated?: string;
  status: FloorStatus;
}

export interface ScorerResult {
  rows: FloorRow[];
}

export interface QualityConfig {
  marketplace_grep: {
    enabled: boolean;
    forbidden_strings: string[];
    forbidden_patterns: string[];
    forbidden_elements: string[];
  };
  typography_accent: {
    wordmark_required: string;
    wordmark_forbidden_visible: string;
  };
  layout_metrics: {
    hero: {
      selector: string;
      whitespace_ratio_min: number;
      full_bleed_required: boolean;
      card_in_card_forbidden: boolean;
    };
    catalogue_grid: {
      selector: string;
      whitespace_ratio_min: number;
      columns_max_below_768: number;
      gutter_min_mobile_px: number;
      gutter_min_desktop_px: number;
    };
  };
  palette_chroma: {
    accent_chroma_max: number;
    forbidden_accent_tokens: string[];
  };
  i18n_key_parity: {
    locales: string[];
    required_key_prefixes: string[];
  };
  lighthouse: {
    performance_min: number;
    accessibility_min: number;
    block_on_preview_absent: boolean;
  };
  asset_contract: {
    inline_base64_forbidden: boolean;
    block_on_host_unreachable: boolean;
  };
  phash_mood_board: {
    manifest: string;
    distance_max_to_any_reference: number;
    distance_min_to_negative_fixture: number;
  };
  kit_scorers: {
    readability_min: number;
    design_tokens_min: number;
    seo_meta_min: number;
    alt_coverage_min: number;
  };
}

export interface RunOptions {
  fixtureMode?: boolean;
  previewUrl?: string;
}

export const MAX_COMPANY_LOGO_BYTES = 256 * 1024;

type LogoFileMetadata = Pick<File, "name" | "size" | "type">;

export function validateCompanyLogo(file: LogoFileMetadata | undefined): string | null {
  if (!file) {
    return null;
  }

  const isSvg =
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  if (!isSvg) {
    return "Select an SVG file.";
  }

  if (file.size > MAX_COMPANY_LOGO_BYTES) {
    return "The SVG file must be 256 KB or smaller.";
  }

  return null;
}

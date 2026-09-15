/**
 * Text measurement against a live element, for the places a layout has to know
 * whether a string will fit before it is shown.
 */

let measureCtx: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  if (typeof document === "undefined") {
    measureCtx = null;
    return null;
  }
  measureCtx = document.createElement("canvas").getContext("2d");
  return measureCtx;
}

/** Whether `text` would sit on one line in this field's content box. */
export function fitsOneLine(field: HTMLTextAreaElement, text: string): boolean {
  const ctx = getMeasureContext();
  if (ctx === null) return true;
  const styles = getComputedStyle(field);
  ctx.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  const letterSpacing =
    styles.letterSpacing === "normal"
      ? 0
      : Number.parseFloat(styles.letterSpacing);
  const textWidth =
    ctx.measureText(text).width + letterSpacing * Math.max(0, text.length - 1);
  const available =
    field.clientWidth -
    Number.parseFloat(styles.paddingLeft) -
    Number.parseFloat(styles.paddingRight);
  return textWidth <= available;
}

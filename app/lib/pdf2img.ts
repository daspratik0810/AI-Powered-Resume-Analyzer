export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

// @ts-expect-error - vite asset import for PDF worker URL
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

function validatePdfFile(file: File): string | null {
    if (!file) return "No file was provided.";
    if (file.size <= 0) return "The selected PDF is empty.";

    const fileName = file.name?.toLowerCase() ?? "";
    const isPdfMime = file.type === "application/pdf" || file.type.includes("pdf");
    const isPdfExtension = fileName.endsWith(".pdf");

    if (!isPdfMime && !isPdfExtension) {
        return "Please upload a valid PDF file.";
    }

    return null;
}

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Use the bundled worker URL from the installed pdfjs-dist package
        lib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    const validationError = validatePdfFile(file);
    if (validationError) {
        return {
            imageUrl: "",
            file: null,
            error: validationError,
        };
    }

    try {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return {
                imageUrl: "",
                file: null,
                error: "PDF conversion requires a browser environment.",
            };
        }

        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF to image: ${message}`,
        };
    }
}
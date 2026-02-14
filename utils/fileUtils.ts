export const fileToBase64 = (file: File): Promise<string> => new Promise((res) => {
    const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res((r.result as string).split(',')[1]);
});
export const getPdfPreview = async (f: File) => null;
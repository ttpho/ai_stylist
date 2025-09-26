import { GoogleGenAI, Modality } from "@google/genai";

// It's assumed that process.env.API_KEY is configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const getMimeType = (file: File): string => {
    return file.type || 'image/jpeg';
};

export const generateVirtualTryOn = async (
    userFile: File,
    userImageBase64: string,
    productFile: File,
    productImageBase64: string
): Promise<string[]> => {
    try {
        const model = 'gemini-2.5-flash-image-preview';

        const userImagePart = {
            inlineData: {
                data: userImageBase64,
                mimeType: getMimeType(userFile),
            },
        };

        const productImagePart = {
            inlineData: {
                data: productImageBase64,
                mimeType: getMimeType(productFile),
            },
        };

        const baseTextPrompt = `As an expert fashion stylist, create a hyper-realistic photo of the person in the first image wearing the clothing item from the second image. The final photo should look natural and fashionable. Ensure the lighting, shadows, and fit of the clothing are realistic. The person's face and body should be preserved. Generate a high-quality result.`;

        const prompts = [
            baseTextPrompt,
            `${baseTextPrompt} Show a full-body shot from the front.`,
            `${baseTextPrompt} Create a version where the person is in a slightly different, casual pose, for example, leaning against a wall.`
        ];

        const generationPromises = prompts.map(prompt => {
            return ai.models.generateContent({
                model: model,
                contents: {
                    parts: [userImagePart, productImagePart, { text: prompt }],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
        });

        const responses = await Promise.all(generationPromises);

        const generatedImages: string[] = [];

        responses.forEach(response => {
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    }
                }
            }
        });

        if (generatedImages.length === 0) {
            throw new Error("The AI could not generate an image from the provided images. Please try again with different images.");
        }

        return generatedImages;

    } catch (error) {
        console.error("Error generating virtual try-on image:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while communicating with the AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
};
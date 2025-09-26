import React, { useState, useCallback, useMemo } from 'react';
import { generateVirtualTryOn } from './services/geminiService';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

interface ImageUploaderProps {
    onFileSelect: (file: File | null, previewUrl: string | null) => void;
    title: string;
    id: string;
    previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, title, id, previewUrl }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            onFileSelect(file, preview);
        } else {
            onFileSelect(null, null);
        }
    };

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">{title}</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-sky-500 transition-colors duration-200">
                <div className="space-y-1 text-center">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="mx-auto h-40 w-auto rounded-md object-contain" />
                    ) : (
                        <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    <div className="flex text-sm text-slate-600">
                        <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500">
                            <span>Upload a file</span>
                            <input id={id} name={id} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-10">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-slate-600 font-medium text-center">AI Stylist is working on your look... <br /> This may take a few moments.</p>
    </div>
);


export default function App() {
    const [userImage, setUserImage] = useState<{ file: File; preview: string } | null>(null);
    const [productImage, setProductImage] = useState<{ file: File; preview: string } | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUserFileSelect = useCallback((file: File | null, previewUrl: string | null) => {
        if (file && previewUrl) {
            setUserImage({ file, preview: previewUrl });
        } else {
            setUserImage(null);
        }
    }, []);
    
    const handleProductFileSelect = useCallback((file: File | null, previewUrl: string | null) => {
        if (file && previewUrl) {
            setProductImage({ file, preview: previewUrl });
        } else {
            setProductImage(null);
        }
    }, []);

    const handleGenerate = async () => {
        if (!userImage || !productImage) {
            setError("Please upload both your image and the product image.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const userImageBase64 = await fileToBase64(userImage.file);
            const productImageBase64 = await fileToBase64(productImage.file);
            
            const images = await generateVirtualTryOn(userImage.file, userImageBase64, productImage.file, productImageBase64);
            setGeneratedImages(images);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = useMemo(() => isLoading || !userImage || !productImage, [isLoading, userImage, productImage]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">AI Stylist</span>: Virtual Try-On
                    </h1>
                    <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
                        Upload your photo and a fashion item to see how AI styles you.
                    </p>
                </header>

                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <ImageUploader 
                            onFileSelect={handleUserFileSelect} 
                            title="Upload your photo"
                            id="user-image-upload"
                            previewUrl={userImage?.preview || null}
                        />
                        <ImageUploader 
                            onFileSelect={handleProductFileSelect} 
                            title="Upload product photo"
                            id="product-image-upload"
                            previewUrl={productImage?.preview || null}
                        />
                    </div>
                    
                    <div className="text-center">
                        <button
                            onClick={handleGenerate}
                            disabled={isButtonDisabled}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-transform transform hover:scale-105"
                        >
                            {isLoading ? 'Styling...' : 'Generate Style'}
                        </button>
                    </div>
                </div>

                <div className="mt-12">
                    {isLoading && <LoadingSpinner />}
                    {error && (
                         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                             <strong className="font-bold">Oh no!</strong>
                             <span className="block sm:inline ml-2">{error}</span>
                         </div>
                    )}
                    {generatedImages.length > 0 && (
                        <div>
                            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Your Results!</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {generatedImages.map((imageSrc, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                        <img src={imageSrc} alt={`Generated style ${index + 1}`} className="w-full h-auto object-cover"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <footer className="text-center py-6 text-sm text-slate-500">
                <p>Powered by Google Gemini AI - @ttpho.</p>
            </footer>
        </div>
    );
}
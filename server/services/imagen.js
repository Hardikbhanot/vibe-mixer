export const generateImage = async (prompt) => {
    try {
        console.log('Generating image URL for prompt:', prompt);
        // cleaning prompt for URL
        const cleanPrompt = encodeURIComponent(prompt.slice(0, 100)); // Limit length for URL safety
        // Using Pollinations.ai which renders on-demand (fast and reliable fallback)
        const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
        return imageUrl;
    } catch (error) {
        console.error("Error generating image URL:", error);
        // Fallback to a generic music vibe image
        return "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=512&h=512&fit=crop";
    }
};

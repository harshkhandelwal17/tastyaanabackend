const { v2 } = require('cloudinary');

v2.config({ 
    cloud_name: 'dcha7gy9o', 
    api_key: '926234579185835', 
    api_secret: 'k-MDaLM8HN1PL2df0RrTrFcME3Q',
});

const uploadToCloudinary = async (buffer) => {
    return new Promise((resolve, reject) => {
        // Validate input
        if (!buffer) {
            console.error('No buffer provided to uploadToCloudinary');
            reject(new Error('No buffer provided'));
            return;
        }

        console.log('Buffer size:', buffer.length);
        console.log('Buffer type:', typeof buffer);
        console.log('Is Buffer:', Buffer.isBuffer(buffer));

        v2.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'products',
                quality: 'auto:good',
                fetch_format: 'auto',
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('Cloudinary upload success:', {
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format
                    });
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

module.exports = { uploadToCloudinary };
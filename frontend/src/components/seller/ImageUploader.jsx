import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  Avatar,
  Typography,
  Paper,
  LinearProgress,
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';

const ImageUploader = ({
  images = [],
  onUpload,
  onRemove,
  uploading = false,
  maxFiles = 5,
}) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const remainingSlots = maxFiles - (images?.length || 0);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="subtitle1" component="div">
          Product Images
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
          ({images?.length || 0}/{maxFiles})
        </Typography>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        {/* Display existing images */}
        {images?.map((image, index) => (
          <Box key={index} position="relative">
            <Avatar
              src={typeof image === 'string' ? image : image.url}
              variant="rounded"
              sx={{ width: 100, height: 100 }}
            />
            <IconButton
              size="small"
              onClick={() => onRemove(index)}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                },
                width: 24,
                height: 24,
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {/* Upload button */}
        {remainingSlots > 0 && (
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="product-image-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={uploading || remainingSlots <= 0}
            />
            <label htmlFor="product-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                disabled={uploading || remainingSlots <= 0}
                sx={{
                  width: 100,
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <PhotoCamera fontSize="small" />
                <Typography variant="caption" component="div">
                  {uploading ? 'Uploading...' : 'Add Image'}
                </Typography>
              </Button>
            </label>
          </Box>
        )}
      </Box>

      <Typography variant="caption" color="textSecondary">
        {remainingSlots > 0
          ? `You can upload up to ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''}`
          : 'Maximum number of images reached'}
      </Typography>
    </Paper>
  );
};

ImageUploader.propTypes = {
  images: PropTypes.array,
  onUpload: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  maxFiles: PropTypes.number,
};

export default ImageUploader;

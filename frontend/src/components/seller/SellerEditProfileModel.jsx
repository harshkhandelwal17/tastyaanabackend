import { useState, useRef } from "react";
import {
  Users as UsersIcon,
  Loader2,
  X,
  MapPin,
  Phone,
  Upload,
  Image as ImageIcon,
  XCircle
} from "lucide-react";
import { useUpdateSellerProfileMutation, useUploadSellerAvatarMutation } from "../../redux/storee/api";
import { useAuth } from "../../hook/useAuth";
import { useSelector } from "react-redux";
const SellerEditProfileModel = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    storeName: user?.sellerProfile?.storeName || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  
  const [updateSellerProfile, { isLoading }] = useUpdateSellerProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadSellerAvatarMutation();
  
  const { user: authUser } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.storeName.trim())
      newErrors.storeName = "Store name is required";
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          avatar: 'Please upload an image file'
        }));
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          avatar: 'File size should be less than 5MB'
        }));
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      
      // Clear any previous errors
      if (errors.avatar) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.avatar;
          return newErrors;
        });
      }
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let avatarUrl = "";
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const uploadResponse = await uploadAvatar(formData).unwrap();
        if (uploadResponse.success) {
          avatarUrl = uploadResponse.filePath;
        }
      }
      
      // Update profile with the new data
      const updateData = {
        ...formData,
        ...(avatarUrl && { avatar: avatarUrl }), // Only include avatar if it was uploaded
      };
      
      const response = await updateSellerProfile(updateData).unwrap();
      
      if (response.success) {
        if (onSuccess) onSuccess(response.user);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Handle API errors
      alert(error.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="mb-6 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <label 
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 border border-gray-300 shadow-sm cursor-pointer hover:bg-gray-50"
                  title="Change avatar"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-gray-600" />
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-gray-300 shadow-sm hover:bg-gray-50"
                    title="Remove avatar"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
              {errors.avatar && (
                <p className="mt-2 text-sm text-red-500">{errors.avatar}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.name ? "border-red-500" : "border-slate-300"
                } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.storeName ? "border-red-500" : "border-slate-300"
                } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="Enter your store name"
              />
              {errors.storeName && (
                <p className="mt-1 text-sm text-red-500">{errors.storeName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 px-3 py-2 border ${
                    errors.phone ? "border-red-500" : "border-slate-300"
                  } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-slate-600 block mb-1">
                Store Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your store address"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center"
            >
              {(isLoading || isUploading) && <Loader2 className="animate-spin mr-2" size={18} />}
              {isUploading ? "Uploading..." : isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SellerEditProfileModel;

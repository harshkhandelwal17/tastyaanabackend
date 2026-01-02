import React from "react";
import { useGetCategoriesQuery } from "../../../redux/api/sellerProductApi";

const CategoryTest = () => {
  const { data, isLoading, error } = useGetCategoriesQuery();

  console.log("Test - Categories Data:", data);
  console.log("Test - Loading:", isLoading);
  console.log("Test - Error:", error);

  return (
    <div className="p-4 border border-gray-300 rounded">
      <h3 className="font-bold mb-2">Category API Test</h3>
      {isLoading && <p>Loading categories...</p>}
      {error && <p className="text-red-500">Error: {JSON.stringify(error)}</p>}
      {data && (
        <div>
          <p>Categories found: {data?.data?.length || 0}</p>
          <ul>
            {(data?.data || []).map((cat) => (
              <li key={cat._id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CategoryTest;

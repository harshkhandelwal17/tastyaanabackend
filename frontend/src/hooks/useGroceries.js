import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { 
  setFilters, 
  resetFilters, 
  setPage, 
  clearSelectedProduct 
} from '../redux/Slices/grocerySlice';
import { 
  useGetGroceriesQuery,
  useLazyGetGroceriesQuery, 
  useSearchGroceriesQuery,
  useLazySearchGroceriesQuery 
} from '../redux/storee/groceryApi';

export const useGroceries = (options = {}) => {
  const {
    products = [],
    selectedProduct = null,
    filters = {},
    pagination = { currentPage: 1, pages: 1, total: 0 }
  } = useSelector((state) => state.grocery);
  const dispatch = useDispatch();
  // Use the regular query hooks for initial data fetching
  const { data: groceriesData, isLoading: isGroceriesLoading, error: groceriesError } = useGetGroceriesQuery(filters, {
    skip: !!filters.search, // Skip if we're doing a search
  });

  const { data: searchData, isLoading: isSearchLoading, error: searchError } = useSearchGroceriesQuery(
    filters.search,
    { skip: !filters.search } // Only run when there's a search term
  );
  

  // Apply any initial filters
  useEffect(() => {
    const hasOptions = Object.keys(options).length > 0;
    if (hasOptions) {
      dispatch(setFilters(options));
    }
  }, [dispatch, options]);

  // Update products and pagination when data changes
  useEffect(() => {
    if (filters.search && searchData) {
      dispatch({
        type: 'grocery/searchGroceries/fulfilled',
        payload: searchData
      });
    } else if (groceriesData) {
      dispatch({
        type: 'grocery/getGroceries/fulfilled',
        payload: groceriesData
      });
    }
  }, [groceriesData, searchData, filters.search, dispatch]);

  const getProductById = (id) => {
    // This would be handled by a separate query in the component
    return id;
  };

  const searchProducts = (searchTerm) => {
    dispatch(setFilters({ ...filters, search: searchTerm, page: 1 }));
  };

  const updateFilters = (newFilters) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
  };

  const changePage = (page) => {
    dispatch(setPage(page));
    window.scrollTo(0, 0);
  };

  const clearProduct = () => {
    dispatch(clearSelectedProduct());
  };

  return {
    products,
    selectedProduct,
    loading: isGroceriesLoading || isSearchLoading,
    error: groceriesError || searchError,
    filters,
    pagination,
    getProductById,
    searchProducts,
    updateFilters,
    changePage,
    clearProduct,
    resetFilters: () => {
      dispatch(resetFilters());
      // Reset to first page after clearing filters
      dispatch(setPage(1));
    }
  };
};

export default useGroceries;

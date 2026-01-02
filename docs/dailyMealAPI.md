# DailyMeal API Documentation

## Overview
The DailyMeal API provides endpoints for managing daily meals, including adding, updating, retrieving, and rating meals.

## Endpoints

### 1. Add Today's Meal
**POST** `/api/dailymeals/today`

Add a new meal for today. Only one meal can exist per day.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "restaurantId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "meals": {
    "low": {
      "lunch": {
        "items": [
          {
            "name": "Dal Khichdi",
            "description": "Healthy rice and lentil dish",
            "quantity": "1 bowl"
          },
          {
            "name": "Curd",
            "description": "Fresh homemade curd",
            "quantity": "1 cup"
          }
        ],
        "totalCalories": 350,
        "price": 120
      },
      "dinner": {
        "items": [
          {
            "name": "Roti Sabzi",
            "description": "Whole wheat roti with mixed vegetables",
            "quantity": "2 rotis + 1 bowl sabzi"
          }
        ],
        "totalCalories": 280,
        "price": 100
      }
    },
    "basic": {
      "lunch": {
        "items": [
          {
            "name": "Rajma Chawal",
            "description": "Kidney beans with rice",
            "quantity": "1 plate"
          }
        ],
        "totalCalories": 450,
        "price": 150
      },
      "dinner": {
        "items": [
          {
            "name": "Paneer Curry",
            "description": "Cottage cheese curry with roti",
            "quantity": "1 plate"
          }
        ],
        "totalCalories": 380,
        "price": 180
      }
    },
    "premium": {
      "lunch": {
        "items": [
          {
            "name": "Butter Chicken",
            "description": "Creamy butter chicken with naan",
            "quantity": "1 plate"
          }
        ],
        "totalCalories": 550,
        "price": 250
      },
      "dinner": {
        "items": [
          {
            "name": "Biryani",
            "description": "Fragrant rice with meat/vegetables",
            "quantity": "1 plate"
          }
        ],
        "totalCalories": 480,
        "price": 220
      }
    }
  },
  "sundaySpecial": {
    "isSpecialDay": true,
    "specialItems": [
      {
        "name": "Gulab Jamun",
        "description": "Sweet dessert",
        "price": 50,
        "category": "dessert"
      }
    ],
    "extraCharges": 30,
    "includedInPlan": false
  },
  "images": [
    {
      "tier": "low",
      "slot": "lunch",
      "url": "https://example.com/low-lunch.jpg",
      "alt": "Low tier lunch"
    }
  ],
  "nutritionalInfo": {
    "low": {
      "calories": 630,
      "protein": "25g",
      "carbs": "85g",
      "fat": "15g"
    },
    "basic": {
      "calories": 830,
      "protein": "35g",
      "carbs": "95g",
      "fat": "25g"
    },
    "premium": {
      "calories": 1030,
      "protein": "45g",
      "carbs": "105g",
      "fat": "35g"
    }
  },
  "chefSpecial": {
    "isChefSpecial": true,
    "specialNote": "Today's special preparation with extra spices",
    "chefName": "Chef Rajesh"
  },
  "availability": {
    "low": true,
    "basic": true,
    "premium": true
  },
  "maxOrders": 500,
  "tags": ["comfort-food", "seasonal", "healthy"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Today's meal added successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "restaurantId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "date": "2024-01-15T00:00:00.000Z",
    "meals": { ... },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Meal for today already exists. Use PATCH to update instead.",
  "existingMealId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

### 2. Update Daily Meal
**PATCH** `/api/dailymeals/:id`

Update an existing daily meal. Only the meal creator or admin can update.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (partial update):**
```json
{
  "meals": {
    "low": {
      "lunch": {
        "items": [
          {
            "name": "Updated Dal Khichdi",
            "description": "Updated healthy rice and lentil dish",
            "quantity": "1 large bowl"
          }
        ],
        "totalCalories": 400,
        "price": 130
      }
    }
  },
  "maxOrders": 600,
  "tags": ["comfort-food", "seasonal", "healthy", "updated"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Daily meal updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "restaurantId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Restaurant Name",
      "email": "restaurant@example.com"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "meals": { ... },
    "maxOrders": 600,
    "tags": ["comfort-food", "seasonal", "healthy", "updated"],
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Daily meal not found"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You do not have permission to update this meal"
}
```

### 3. Get Today's Meal
**GET** `/api/dailymeals/today`

Retrieve today's meal (public endpoint).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "restaurantId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "date": "2024-01-15T00:00:00.000Z",
    "meals": { ... },
    "currentOrders": 45,
    "maxOrders": 500
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "No meal found for today",
  "date": "2024-01-15",
  "suggestion": "Please check back later or contact support"
}
```

### 4. Get Meal by Date
**GET** `/api/dailymeals/date/:date`

Retrieve meal for a specific date.

**Parameters:**
- `date`: Date in YYYY-MM-DD format

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "restaurantId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "date": "2024-01-15T00:00:00.000Z",
    "meals": { ... }
  }
}
```

### 5. Get Weekly Menu
**GET** `/api/dailymeals/weekly`

Retrieve meals for the current week.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "date": "2024-01-15T00:00:00.000Z",
      "meals": { ... }
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "date": "2024-01-16T00:00:00.000Z",
      "meals": { ... }
    }
  ]
}
```

### 6. Rate Daily Meal
**POST** `/api/dailymeals/:id/rate`

Rate today's meal (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Great taste and good portion size!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "user": "64f8a1b2c3d4e5f6a7b8c9d4",
    "meal": "64f8a1b2c3d4e5f6a7b8c9d1",
    "date": "2024-01-15T00:00:00.000Z",
    "rating": 4,
    "feedback": "Great taste and good portion size!",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Error Codes

- `400`: Bad Request - Invalid data or meal already exists
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Meal not found
- `500`: Internal Server Error - Server error

## Notes

1. Only one meal can exist per day
2. Only the meal creator or admin can update meals
3. Users can only rate a meal once per day
4. All dates are stored in UTC format
5. The API automatically handles date validation and meal existence checks 
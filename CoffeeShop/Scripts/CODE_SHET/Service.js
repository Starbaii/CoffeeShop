app.service("CoffeeShopService", function ($http) {
    this.verifyUser = function (email, uType, password) {
        return $http.post('/CoffeeShop/ValidateUser', { email: email, uType: uType, password: password });
    }
    this.verifyEmail = function (email, uType) {
        return $http.post('/CoffeeShop/VerifyEmail', { email: email, uType: uType });
    }
    this.validateOTP = function (otpCode) {
        return $http.post("/CoffeeShop/ValidateOTP", { enteredOtp: otpCode });
    };
    this.saveOrderItem = function (orderItemData, dateNow, paymentMethod, gcashRef, cashTendered, changeAmount) {
        return $http.post("/CoffeeShop/SaveOrderItem", {
            orderItemData: orderItemData,
            dateNow: dateNow,
            paymentMethod: paymentMethod,
            gcashRef: gcashRef,
            cashTendered: cashTendered,
            changeAmount: changeAmount,
        });
    }
    this.addAdminService = function (adminData) {
        return $http.post("/CoffeeShop/AddAdmin", {
            adminData: adminData
        });
    }
    this.voidOrderService = function (orderId) {
        return $http.post("/CoffeeShop/VoidOrder", { orderId: orderId });
    };
    this.getOrderHistoryService = function () {
        return $http({
            method: "GET",
            url: "/CoffeeShop/GetOrderHistory",
            headers: { "Content-Type": "application/json" }
        });
    };
    this.GetOrderDetailsService = function () {
        return $http({
            method: "GET",
            url: "/CoffeeShop/GetOrderDetails",
            headers: { "Content-Type": "application/json" }
        });
    };
    this.saveOrder = function (orderData) {
        return $http.post("/CoffeeShop/SaveOrder", { orderData: orderData });
    }
    this.getProductQuantityService = function (productId) {
        return $http.post("/CoffeeShop/GetProductQuantity", { productId: productId });
    }
    this.getSalesSummaryService = function () {
        return $http.get('/CoffeeShop/GetSalesSummary');
    };
    this.getTodaySales = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetTodaySales'
        });
    };

    this.getTotalOrdersToday = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetTotalOrdersToday'
        });
    };

    this.getTopSellingItemToday = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetTopSellingItemToday'
        });
    };
    this.getSalesByCategory = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetSalesByCategory'
        });
    };
    this.getWeeklySales = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetWeeklySales'
        });
    };
    this.getAllProductsSales = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetAllProductsSales'
        });
    };
    this.getMonthlySales = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetMonthlySales'
        });
    };
    this.getTrafficData = function () {
        return $http({
            method: 'GET',
            url: '/CoffeeShop/GetTrafficData'
        });
    };
    this.getUserSession = function () {
        return $http.get("/CoffeeShop/GetUserSession");
    }
    this.getOrderSession = function () {
        return $http.get("/CoffeeShop/GetOrderSession");
    }
    this.getProductDetailsService = function () {
        return $http.get("/CoffeeShop/GetProductDetails");
    }
    this.getProductInventoryService = function () {
        return $http.get("/CoffeeShop/GetProductInventory");
    };
    this.getProductAddOnsService = function () {
        return $http.get("/CoffeeShop/GetProductDetails");
    }
    this.removeUserSession = function () {
        return $http.get("/CoffeeShop/RemoveUserSession");
    }
    this.getSessionOtp = function () {
        return $http.get("/CoffeeShop/GetOtp");
    }
    this.sessionExpirationOTP = function () {
        return $http.get("/CoffeeShop/DeleteOTP");
    }
    this.updatePassword = function (email, uType, newPassword) {
        return $http.post('/CoffeeShop/UpdatePassword', { email: email, uType: uType, password: newPassword });
    }
    this.updateStockItemsService = function (tempArray) {
        return $http.post('/CoffeeShop/UpdateStockItems', { tempArray: tempArray });
    }

    //this.validateOTP = function (otpInput) {
    //    var response = $http({
    //        method: "post",
    //        url: "/Main/ValidateOTP", //I link mo sa MainController functions
    //        data: userInfo
    //    });
    //    return response;
    //}

    // 1. User Registration / Verify
    //this.jsonService = function (userInfo) {
    //    var response = $http({
    //        method: "post",
    //        url: "/CoffeeShop/VerifyConnection",
    //        data: userInfo
    //    });
    //    return response;
    //}

    //// 2. Add to Cart
    //this.saveOrderService = function (orderInfo) {
    //    var response = $http({
    //        method: "post",
    //        url: "/CoffeeShop/SaveOrder",
    //        data: orderInfo
    //    });
    //    return response;
    //}

    //// 3. Get Cart Items
    //this.getOrdersService = function () {
    //    return $http({
    //        method: "get",
    //        url: "/CoffeeShop/GetOrders"
    //    });
    //};

    //// 4. Checkout
    //this.placeOrderService = function (total, method) {
    //    return $http({
    //        method: "post",
    //        url: "/CoffeeShop/PlaceOrder",
    //        data: {
    //            totalAmount: total,
    //            paymentMethod: method
    //        }
    //    });
    //};

    //// 5. Dashboard Charts
    //this.getChartDataService = function () {
    //    return $http.get('/CoffeeShop/GetChartData');
    //}

    //// 6. Get All Products (Menu & Admin)
    //this.getAllProductsService = function () {
    //    return $http({
    //        method: "get",
    //        url: "/CoffeeShop/GetAllProducts"
    //    });
    //};

    //// 7. Add New Product (Admin)
    //this.addProductService = function (productData) {
    //    return $http({
    //        method: "post",
    //        url: "/CoffeeShop/AddProduct",
    //        data: productData
    //    });
    //};

    //// 8. Delete Product (Admin) - UPDATED
    //this.deleteProductService = function (id) {
    //    return $http({
    //        method: "post",
    //        url: "/CoffeeShop/DeleteProduct",
    //        // CHANGED FROM 'data' TO 'params'
    //        // This forces Angular to send ?id=5 in the URL, which is safer for MVC Controllers
    //        params: { id: id }
    //    });
    //};

    //Robs
    this.uploadFile = function (fileInput) {
        var formData = new FormData();
        formData.append("file", fileInput);

        return $http({
            method: "POST",
            url: "/CoffeeShop/Upload",
            data: formData,
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        });
    };


    // In CoffeeShopService
    this.addEmployee = function (employeeInfo) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/addEmployee",
            data: employeeInfo,
            headers: { "Content-Type": "application/json" }
        });
    };
    // In CoffeeShopService
    this.updateEmployee = function (employeeInfo) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/UpdateEmployee",
            data: employeeInfo,
            headers: { "Content-Type": "application/json" }
        });
    };
    this.getEmployees = function () {
        return $http({
            method: "GET",
            url: "/CoffeeShop/GetEmployees"
        });
    };

    // Employee Logout tracking
    this.employeeLogout = function (employeeId) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/EmployeeLogout",
            data: { employeeId: employeeId },
            headers: { "Content-Type": "application/json" }
        });
    };

    //Product services

    this.addProduct = function (productInfo) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/AddProduct",
            data: productInfo,
            headers: { "Content-Type": "application/json" }
        });
    };

    // Get all products
    this.getProducts = function () {
        return $http({
            method: "GET",
            url: "/CoffeeShop/GetProducts"
        });
    };

    this.updateProduct = function (product) {
        return $http.post('/CoffeeShop/updateProduct', product);
    };

    // Delete a product
    this.deleteProduct = function (id) {
        return $http.post('/CoffeeShop/DeleteProduct', { id: id });
    };

    // Delete Order (hard delete)
    this.deleteOrder = function (orderId, password) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/DeleteOrder",
            data: { orderId: orderId, password: password },
            headers: { "Content-Type": "application/json" }
        });
    };

    // Void Employee (soft delete)
    this.voidEmployee = function (employeeId, password) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/VoidEmployee",
            data: { employeeId: employeeId, password: password },
            headers: { "Content-Type": "application/json" }
        });
    };

    // Reactivate Employee
    this.reactivateEmployee = function (employeeId, password) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/ReactivateEmployee",
            data: { employeeId: employeeId, password: password },
            headers: { "Content-Type": "application/json" }
        });
    };

    // Delete Employee (hard delete)
    this.deleteEmployeePermanent = function (employeeId, password) {
        return $http({
            method: "POST",
            url: "/CoffeeShop/DeleteEmployee",
            data: { employeeId: employeeId, password: password },
            headers: { "Content-Type": "application/json" }
        });
    };

    // Get Activity Logs
    this.getActivityLogs = function () {
        return $http({
            method: "GET",
            url: "/CoffeeShop/GetActivityLogs",
            headers: { "Content-Type": "application/json" }
        });
    };


});

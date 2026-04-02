app.controller("CoffeeShopController", ["$scope", "$http", "CoffeeShopService", "$compile",
    function ($scope, $http, CoffeeShopService, $compile) {

        $scope.debug = function () {
            console.log(currentOrder);
            currentOrder.forEach(function (item) {
                console.log(`Item: ${item.name}, Quantity: ${item.quantity}, Unit Price: ${item.unitPrice}, Total Price: ${item.totalPrice}`);
            });
        };

        $scope.getUserSession = function () {
            CoffeeShopService.getUserSession()
                .then(function (response) {
                    if (response.data.success) {
                        const objData = response.data.data;
                        $scope.employeeid = objData.UserID;
                        $scope.fullname = objData.UserName;
                        $scope.nickName = objData.UserNickname;
                        $scope.contact = objData.UserContact;
                        $scope.email = objData.UserEmail;
                        $scope.userType = objData.UserType; // Add this line
                    } else {
                        console.log(`No active user session: ${response.data.session}`);
                    }
                });
        }
        $scope.removeUserSession = function () {
            CoffeeShopService.removeUserSession()
                .then(function (response) {
                    if (response.data.success) {
                        //alert(`Successfully abandoned Session: ${response}`);
                    } else {
                        console.log("Error abandoning User logout session.");
                    }
                });
        }

        $scope.uType = null;

        $scope.updatePassword = function () {
            $scope.email = $scope.recoveryEmail;
            $scope.newPassword = null;

            if ($scope.nPassword === $scope.cPassword) {
                $scope.newPassword = $scope.nPassword;
                CoffeeShopService.updatePassword($scope.email, $scope.uType, $scope.newPassword)
                    .then(function (response) {
                        window.showRecoveryStep('code');
                        alert(response.data.message);
                    });
            } else {
                alert("Password did not match. Please try again.");
            }
        };

        $scope.verifyUser = function (uType) {
            var email = $scope.emailLogin;
            var password = $scope.passwordLogin;

            CoffeeShopService.verifyUser(email, uType, password)
                .then(function (response) {
                    if (response.data.success) {
                        if (uType === "Admin") {
                            $scope.uType = "Admin";
                            window.location.href = "/CoffeeShop/AboutPage";
                        } else {
                            $scope.uType = "Employee";
                            window.location.href = "/CoffeeShop/CoffeeCollectivesPage";
                        }
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Login Failed',
                            text: 'Invalid email or password. Please try again.',
                            confirmButtonColor: '#A8A54A'
                        });
                    }
                })
                .catch(() => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Server Error',
                        text: 'Something went wrong while verifying your login.',
                        confirmButtonColor: '#A8A54A'
                    });
                });
        };

        $scope.verifyEmail = function () {
            $scope.email = $scope.recoveryEmail;
            CoffeeShopService.verifyEmail($scope.email, $scope.uType)
                .then(function (response) {
                    alert(response.data.message);
                    if (response.data.success) {
                        window.showRecoveryStep('code');
                    }
                });
        };

        $scope.validateOTP = function () {
            let OTPInput = ($scope.otp.d1 || '') +
                ($scope.otp.d2 || '') +
                ($scope.otp.d3 || '') +
                ($scope.otp.d4 || '') +
                ($scope.otp.d5 || '') +
                ($scope.otp.d6 || '');

            CoffeeShopService.validateOTP(OTPInput).then(function (response) {
                if (response.data.success) {
                    window.showRecoveryStep('password');
                } else {
                    alert(`It did not worked: ${response.data.message}`);
                }
            });
        }

        $scope.getOrderHistory = function (tableId) {
            var getData = CoffeeShopService.getOrderHistoryService();
            getData.then(function (returnedData) {
                console.log(returnedData.data.data);

                if (returnedData.data.success) {
                    var orders = returnedData.data.data;

                    if ($.fn.DataTable.isDataTable('#' + tableId)) {
                        var table = $('#' + tableId).DataTable();
                        table.clear();
                        table.rows.add(orders);
                        table.draw();
                        // Recompile the entire table
                        $compile($('#' + tableId).find('tbody'))($scope);
                    } else {
                        $('#' + tableId).DataTable({
                            data: orders,
                            columns: [
                                { data: 'Ordercode', title: 'Order Code' },
                                {
                                    data: 'Datecreated',
                                    title: 'Date Created',
                                    render: function (data) {
                                        if (!data) return '';
                                        var timestamp = parseInt(data.replace(/\/Date\((\d+)\)\//, '$1'), 10);
                                        var jsDate = new Date(timestamp);
                                        return jsDate.toLocaleString();
                                    }
                                },
                                {
                                    data: 'Orderitems',
                                    title: 'Items',
                                    render: function (data) {
                                        if (!data || !Array.isArray(data)) return 'N/A';
                                        return data.map(item =>
                                            `${item.Quantity}x ${item.ProductName}`
                                        ).join('<br>');
                                    }
                                },
                                {
                                    data: 'Ordertotal',
                                    title: 'Total',
                                    render: function (data) {
                                        if (data == null) return '';
                                        return '&#8369;' + data + '.00';
                                    }
                                },
                                { data: 'Orderstatus', title: 'Order Status' },
                                {
                                    data: null,
                                    title: 'Action',
                                    render: function (data, type, row, meta) {
                                        // Use ng-click instead of onclick
                                        let html = `
                                    <div class="order-actions-cell">
                                        <button class="history-action-btn view-details-btn" ng-click="viewOrderDetails(${row.Ordercode})">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>
                                `;

                                        if (row.Orderstatus !== 'Voided' && row.Orderstatus !== 'voided') {
                                            html += `
                                        <button class="history-action-btn void-order-btn" ng-click="voidOrder(${row.OrderID})">
                                            <i class="fas fa-ban"></i> Void Order
                                        </button>
                                    `;
                                        }

                                        html += `
                                        <button class="history-action-btn delete-order-btn" ng-click="deleteOrder(${row.OrderID}, ${row.Ordercode})">
                                            <i class="fas fa-trash-alt"></i> Delete
                                        </button>
                                    </div>
                                `;

                                        return html;
                                    }
                                }
                            ],
                            order: [[1, 'desc']],
                            //dom: '<"row"<"col s6"l><"col s6"f>>rt<"row"<"col s6"i><"col s6"p>>',
                            drawCallback: function () {
                                // Compile the new rows after each draw
                                var api = this.api();
                                var tbody = $(api.table().body());
                                $compile(tbody)($scope);
                                $scope.$apply();
                            },
                            createdRow: function (row, data, dataIndex) {
                                // Compile each row as it's created
                                $compile(angular.element(row))($scope);
                            },
                            initComplete: function () {
                                // Final compilation after table is fully loaded
                                var tbody = $(this.api().table().body());
                                $compile(tbody)($scope);
                                $scope.$apply();
                            }
                        });
                    }
                }
            });
        };

        $scope.getProductInventory = function (tableId) {
            var getData = CoffeeShopService.getProductInventoryService();
            getData.then(function (returnedData) {
                console.log(returnedData.data.data);

                if (returnedData.data.success) {
                    var products = returnedData.data.data;

                    if ($.fn.DataTable.isDataTable('#' + tableId)) {
                        var table = $('#' + tableId).DataTable();
                        table.clear();
                        table.rows.add(products);
                        table.draw();
                        $compile($('#' + tableId).find('tbody'))($scope);
                    } else {
                        $('#' + tableId).DataTable({
                            data: products,
                            columns: [
                                {
                                    data: 'Productpicpath',
                                    title: 'Image',
                                    render: function (data, type, row) {
                                        if (!data) return 'No Image';
                                        return `<div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden;">
                                            <img src="${data}" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>`;
                                    }
                                },
                                {
                                    data: 'Productname',
                                    title: 'Product Name',
                                    render: function (data) {
                                        return `<strong>${data}</strong>`;
                                    }
                                },
                                {
                                    data: 'CategoryName',
                                    title: 'Category',
                                    render: function (data) {
                                        if (!data) return '—';
                                        return `<span class="status-badge" style="background: rgba(168, 165, 74, 0.1); color: var(--color-accent);">${data}</span>`;
                                    }
                                },
                                {
                                    data: 'Productprice',
                                    title: 'Price',
                                    render: function (data) {
                                        return `₱${data}.00`;
                                    }
                                },
                                {
                                    data: 'Stock',
                                    title: 'Stock',
                                    render: function (data) {
                                        return `${data} units`;
                                    }
                                },
                                {
                                    data: 'Addons',
                                    title: 'Add-ons',
                                    render: function (data) {
                                        if (!data || data.length === 0) {
                                            return '<span style="color: #a58b74;">No add-ons</span>';
                                        }
                                        return data.map(addon =>
                                            `<div style="margin-bottom: 4px;">
                                        <span style="color: var(--color-accent); font-weight: 600;">${addon.AddonName}</span>
                                        <span style="color: var(--color-primary); font-weight: 600;"> (+₱${addon.AddonPrice})</span>
                                    </div>`
                                        ).join('');
                                    }
                                },
                                {
                                    data: 'Status',
                                    title: 'Status',
                                    render: function (data) {
                                        if (data === 'active') {
                                            return `<span class="status-badge status-active">In Stock</span>`;
                                        } else {
                                            return `<span class="status-badge status-out">Out of Stock</span>`;
                                        }
                                    }
                                },
                                {
                                    data: null,
                                    title: 'Actions',
                                    render: function (data, type, row) {
                                        return `
                                    <div class="action-buttons">
                                        <button class="action-btn edit-btn" ng-click="editProduct(${row.ProductID})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="action-btn delete-btn" ng-click="deleteProduct(${row.ProductID})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                `;
                                    }
                                }
                            ],
                            order: [[1, 'asc']], // Order by product name
                            pageLength: 10,
                            lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
                            drawCallback: function () {
                                var api = this.api();
                                var tbody = $(api.table().body());
                                $compile(tbody)($scope);
                                $scope.$apply();
                            },
                            createdRow: function (row, data, dataIndex) {
                                $compile(angular.element(row))($scope);
                            },
                            initComplete: function () {
                                var tbody = $(this.api().table().body());
                                $compile(tbody)($scope);
                                $scope.$apply();

                            }
                        });
                    }

                    $('#categoryFilter').off().on('change', function () {
                        var table = $('#inventoryTable').DataTable();
                        table.column(2).search($(this).val()).draw();
                    });
                } else {
                    console.log(returnedData.data.message);
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to load inventory data',
                        icon: 'error',
                        confirmButtonColor: '#A8A54A'
                    });
                }
            }).catch(function (error) {
                console.error("Error fetching inventory:", error);
                Swal.fire({
                    title: 'Connection Error',
                    text: 'Unable to connect to the server',
                    icon: 'error',
                    confirmButtonColor: '#A8A54A'
                });
            });
        };

        $scope.viewOrderDetails = function (orderCode) {
            var getData = CoffeeShopService.GetOrderDetailsService();
            getData.then(function (returnedData) {
                console.log(returnedData.data.data);

                if (returnedData.data.success) {
                    const orderHistory = returnedData.data.data;
                    const order = orderHistory.find(o => o.Ordercode === orderCode);
                    console.log(order);

                    let itemsHtml = '';
                    order.Orderitems.forEach(item => {
                        itemsHtml += `
                            <div class="order-details-item">
                                <span class="order-details-item-name">${item.Quantity}x ${item.ProductName}</span>
                                <span class="order-details-item-price">&#8369;${(item.Price)}.00</span>
                            </div>`;

                        if (item.Addons != null) {
                            itemsHtml += `
                                <div class="order-details-item" style="padding-left: 20px;">
                                    <span class="order-details-item-name">+ ${item.Addons}</span>
                                    <span class="order-details-item-price"></span>
                                </div>`;
                        };
                    });

                    const transactionData = order.OrderTransaction[0];
                    console.log(order);

                    const rawDate = parseInt((order.DateCreated).replace(/\/Date\((\d+)\)\//, '$1'), 10);
                    const DateCreated = new Date(rawDate);
                    let gcashHtml = "";
                    if (transactionData.GCashRef && transactionData.GCashRef !== "0") {
                        gcashHtml = `
                    <div class="order-details-total" style="font-size:16px;">
                        <code>Gcash Ref:</code>
                        <code>${transactionData.GCashRef}</code>
                    </div>`;
                                }


                    const detailsHtml = `
                        <div class="order-details-container">
                            <div class="order-details-header">
                                <div class="order-details-id">Order #${order.Ordercode}</div>
                                <div class="order-details-date">${DateCreated} • ${order.Ordertype} • Order taken by: <b>${order.Employee}</b></div>
                            </div>
                            <div class="order-details-items">
                                ${itemsHtml}
                            </div>
                            <div class="order-details-total">
                                <span>Total Amount:</span>
                                <span>&#8369; ${order.Ordertotal}.00</span>
                            </div>
                            <div class="order-details-total" style="font-size:16px;">
                                <code>Payment method:</code>
                                <code>${transactionData.Transactiontype}</code>
                            </div>
                            ${gcashHtml}
                            <div class="order-details-total" style="font-size:16px;">
                                <code>Paid amount:</code>
                                <code>₱ ${transactionData.AmountPaid}.00</code>
                            </div>
                            <div class="order-details-total" style="font-size:16px;">
                                <code>Change amount:</code>
                                <code>&#8369; ${transactionData.AmountChange}.00</code>
                            </div>
                            <div class="order-details-status">
                                Status: <span class="order-status ${order.Orderstatus === 'completed' ? 'status-completed' : order.Orderstatus === 'preparing' ? 'status-preparing' : 'status-pending'}">
                                    ${order.Orderstatus.charAt(0).toUpperCase() + order.Orderstatus.slice(1)}
                                </span>
                            </div>
                        </div>
                    `;

                    Swal.fire({
                        title: 'Order Details',
                        html: detailsHtml,
                        confirmButtonText: 'Close',
                        confirmButtonColor: '#A8A54A',
                        width: 600
                    });
                } else {
                    console.log(returnedData.data.message)
                }
            })
        }

        $scope.cancelOrder = function () {
            if (currentOrder.length === 0) {
                Swal.fire({
                    title: 'Order is Empty',
                    text: 'There are no items to cancel.',
                    icon: 'info',
                    confirmButtonColor: '#A8A54A'
                });
                return;
            }

            Swal.fire({
                title: 'Cancel Order?',
                text: 'This will remove all items from your order. This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Yes, cancel order!',
                cancelButtonText: 'Keep items'
            }).then((result) => {
                if (result.isConfirmed) {
                    currentOrder = [];
                    updateOrderDisplay();
                    Swal.fire(
                        'Order Cancelled!',
                        'Your order has been cleared.',
                        'success'
                    );
                }
            });
        }

        // ── Internal helper: save order to DB and print receipt ──────────────────
        function _processSaveAndReceipt(totalAmount, paymentMethod, gcashRef, cashTendered, changeAmount) {
            //$scope.orderCode = "";
            //const now = new Date();
            //const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const historyItems = currentOrder.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.unitPrice,
                addons: item.addons.map(a => a.name)
            }));

            //orderHistory1.unshift({
            //    id: $scope.orderCode,
            //    date: dateStr,
            //    items: historyItems,
            //    total: totalAmount,
            //    status: "pending",
            //    orderType: currentOrder[0]?.orderType || "dine-in",
            //    paymentMethod: paymentMethod,
            //    gcashRef: gcashRef || null,
            //    employee: "John Doe"
            //});

            const now = new Date();
            const year = now.getFullYear();
            //$scope.autoRef = `${year}` + Math.floor(1000 + Math.random() * 90000000000);

            var ordertype = currentOrder[0].orderType;

            var orderData = {
                EmployeeID: $scope.employeeid,
                Ordertotal: totalAmount,
                Ordertype: ordertype.charAt(0).toUpperCase() + ordertype.slice(1),
                Orderstatus: "Completed",
                PaymentMethod: paymentMethod,
                GcashRef: $scope.autoRef || ""
            };

            CoffeeShopService.saveOrder(orderData)
                .then(function (responseOne) {
                    if (responseOne.data.success) {
                        const dbOrderId = responseOne.data.orderId;
                        $scope.orderCode = responseOne.data.orderCode;
                        //$scope.orderCode1 = orderCode;
                        const dateNow = responseOne.data.dateTime;
                        var timestamp1 = parseInt(dateNow.replace(/\/Date\((\d+)\)\//, '$1'), 10);
                        var jsDate1 = new Date(timestamp1);
                        const tempArray = [];

                        currentOrder.forEach(function (item) {
                            tempArray.push({ productId: item.productId, quantity: item.quantity });

                            const addOnsResult = item.addons.map(a => a.name).join(', ');
                            var orderItemData = {
                                OrderID: dbOrderId,
                                ProductID: item.productId,
                                DrinkType: item.drinkType,
                                Quantity: item.quantity,
                                AddOns: addOnsResult,
                                Price: item.totalPrice
                            };

                            CoffeeShopService.saveOrderItem(orderItemData, dateNow, paymentMethod, gcashRef, cashTendered, changeAmount)
                                .then(function (response) {
                                    if (response.data.success) {
                                        console.log("Order item saved successfully!");
                                        
                                        
                                        CoffeeShopService.updateStockItemsService(tempArray)
                                            .then(function (response) {
                                                if (response.data.success) {
                                                    console.log("Successfully updated stock");
                                                } else {
                                                    console.log(response.data.message);
                                                }
                                            });
                                    } else {
                                        console.log(response.data.message);
                                        alert("Failed to save order.");
                                    }
                                });
                        });


                        // ── Build receipt ──────────────────────────────────────────────
                        const paymentLine = paymentMethod === 'GCash'
                            ? `<p>Payment: GCash</p><p>GCash Ref #: <b>${$scope.autoRef}</b></p>`
                            : `<p>Payment: Cash</p>
                               <p>Cash Amount: &#8369;${cashTendered}.00</p>
                               <p>Change: &#8369;${changeAmount}</p>`;

                        const width = 450;
                        const height = 700;
                        const left = (screen.width / 2) - (width / 2);
                        const top = (screen.height / 2) - (height / 2);

                        // Open centered window
                        let receiptWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
                        receiptWindow.document.write(`
                            <html>
                            <head><title>Receipt Preview</title></head>
                            <body style="font-family: monospace, Arial, sans-serif; font-size: 14px; line-height:1.4; color:#000;">
                                <div style="width:280px; margin:0 auto;">
                                    <h3 style="text-align:center; margin:0;">828 Cafe</h3>
                                    <p style="text-align:center; margin:0;">61b 17th Ave, Cubao, Quezon City, Metro Manila</p>
                                    <hr style="border:none; border-top:1px dashed #000; margin:5px 0;">
                                    <p>Order #: ${$scope.orderCode}</p>
                                    <p>Date: ${jsDate1.toLocaleString()}</p>
                                    <hr style="border:none; border-top:1px dashed #000; margin:5px 0;">
                                    <table style="width:100%; border-collapse:collapse; font-size:14px;">
                                        <thead>
                                            <tr>
                                                <th style="text-align:left;">Item</th>
                                                <th style="text-align:right;">Qty</th>
                                                <th style="text-align:right;">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${currentOrder.map(item => `
                                                <tr>
                                                    <td>${item.name}</td>
                                                    <td style="text-align:right; padding-right:5px;">${item.quantity}x</td>
                                                    <td style="text-align:right;">&#8369;${item.totalPrice}.00</td>
                                                </tr>
                                                ${item.addons.length > 0 ? `
                                                <tr>
                                                    <td style="padding-left:15px;">+ Add-ons: ${item.addons.map(a => a.name).join(', ')}</td>
                                                    <td></td><td></td>
                                                </tr>` : ''}
                                            `).join('')}
                                        </tbody>
                                    </table>
                                    <hr style="border:none; border-top:1px dashed #000; margin:5px 0;">
                                    <p style="text-align:right;"><strong>Total: &#8369;${totalAmount}.00</strong></p>
                                    <hr style="border:none; border-top:1px dashed #000; margin:5px 0;">
                                    ${paymentLine}
                                    <hr style="border:none; border-top:1px dashed #000; margin:5px 0;">
                                    <p style="text-align:center;">Thank you for your purchase!</p>
                                    <p style="text-align:center;">This serves as your official receipt.</p>
                                    <button onclick="window.print()">Print Receipt</button>
                                </div>
                            </body>
                            </html>
                        `);
                        Swal.fire({
                            title: 'Order Confirmed!',
                            html: `Order <b>#${$scope.orderCode}</b> placed successfully.<br>
                           Total: <b>&#8369; ${totalAmount}.00</b><br>
                           Payment: <b>${paymentMethod}</b>
                           ${paymentMethod === 'GCash' ? `<br>GCash Ref #: <b>${$scope.autoRef}</b>` : `<br>Change: <b>&#8369; ${changeAmount}.00</b>`}`,
                            icon: 'success',
                            confirmButtonColor: '#A8A54A'
                        }).then(() => {
                            currentOrder = [];
                            $scope.updateOrderDisplay();
                            updateCartBadge();
                            location.reload();
                        });
                        receiptWindow.document.close();
                    }
                });

                
        }

        // ── STEP 2a: Cash payment modal ───────────────────────────────────────
        function _showCashModal(totalAmount) {
            Swal.fire({
                title: '<i class="fas fa-money-bill-wave" style="color:#28a745;margin-right:8px;"></i> Cash Payment',
                html: `
                    <style>
                        .cash-total-display {
                            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                            border: 2px solid #dee2e6;
                            border-radius: 12px;
                            padding: 16px;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                        .cash-total-label { font-size: 13px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
                        .cash-total-amount { font-size: 32px; font-weight: 800; color: #6F4E37; margin-top: 4px; }
                        .cash-quick-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; justify-content: center; }
                        .cash-quick-btn {
                            padding: 8px 16px;
                            border: 2px solid #A8A54A;
                            border-radius: 8px;
                            background: white;
                            color: #6F4E37;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-size: 14px;
                        }
                        .cash-quick-btn:hover { background: #A8A54A; color: white; }
                        .change-display {
                            background: linear-gradient(135deg, rgba(40,167,69,0.1), rgba(33,136,56,0.1));
                            border: 2px solid rgba(40,167,69,0.3);
                            border-radius: 12px;
                            padding: 14px;
                            margin-top: 16px;
                            text-align: center;
                            display: none;
                        }
                        .change-display.visible { display: block; }
                        .change-display.insufficient { background: rgba(220,53,69,0.1); border-color: rgba(220,53,69,0.3); }
                        .change-label { font-size: 13px; color: #6c757d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
                        .change-amount { font-size: 28px; font-weight: 800; color: #28a745; margin-top: 4px; }
                        .change-amount.insufficient { color: #dc3545; }
                    </style>
                    <div class="cash-total-display">
                        <div class="cash-total-label">Amount Due</div>
                        <div class="cash-total-amount">&#8369; ${totalAmount}.00</div>
                    </div>
                    <div class="order-form-group">
                        <label class="order-form-label" style="font-weight:700;">Cash Tendered</label>
                        <input type="number" id="cashTendered" class="order-form-input"
                               placeholder="Enter amount received" min="${totalAmount}" step="1"
                               style="font-size:18px; font-weight:700; text-align:center;">
                        <div class="cash-quick-btns" id="quickBtns"></div>
                    </div>
                    <div class="change-display" id="changeDisplay">
                        <div class="change-label" id="changeLabel">Change</div>
                        <div class="change-amount" id="changeAmount">&#8369; 0.00</div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-check"></i> Complete Payment',
                cancelButtonText: '<i class="fas fa-arrow-left"></i> Back',
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6F4E37',
                width: 480,
                didOpen: () => {
                    const input = document.getElementById('cashTendered');
                    const changeDisp = document.getElementById('changeDisplay');
                    const changeAmt = document.getElementById('changeAmount');
                    const changeLabel = document.getElementById('changeLabel');
                    const quickBtns = document.getElementById('quickBtns');

                    // ── Quick-amount buttons (round up to next convenient denominations)
                    const denominations = [20, 50, 100, 200, 500, 1000];
                    const suggestions = denominations.filter(d => d >= totalAmount);
                    // Always include the exact amount and a couple of round-ups
                    const exactAndAbove = [totalAmount, ...suggestions].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
                    exactAndAbove.forEach(amt => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'cash-quick-btn';
                        btn.textContent = `₱${amt}`;
                        btn.addEventListener('click', () => {
                            input.value = amt;
                            input.dispatchEvent(new Event('input'));
                        });
                        quickBtns.appendChild(btn);
                    });

                    // ── Live change calculation
                    input.addEventListener('input', function () {
                        const tendered = parseFloat(this.value) || 0;
                        if (tendered <= 0) {
                            changeDisp.classList.remove('visible', 'insufficient');
                            return;
                        }
                        changeDisp.classList.add('visible');
                        const change = tendered - totalAmount;
                        if (change < 0) {
                            changeDisp.classList.add('insufficient');
                            changeAmt.classList.add('insufficient');
                            changeLabel.textContent = 'Insufficient Amount';
                            changeAmt.innerHTML = `&#8369; ${Math.abs(change).toFixed(2)} short`;
                        } else {
                            changeDisp.classList.remove('insufficient');
                            changeAmt.classList.remove('insufficient');
                            changeLabel.textContent = 'Change';
                            changeAmt.innerHTML = `&#8369; ${change.toFixed(2)}`;
                        }
                    });

                    input.focus();
                },
                preConfirm: () => {
                    const tendered = parseFloat(document.getElementById('cashTendered').value) || 0;
                    if (!tendered || tendered <= 0) {
                        Swal.showValidationMessage('Please enter the cash amount tendered.');
                        return false;
                    }
                    if (tendered < totalAmount) {
                        Swal.showValidationMessage(`Cash tendered (₱${tendered}) is less than the total (₱${totalAmount}).`);
                        return false;
                    }
                    return { tendered: tendered, change: tendered - totalAmount };
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    _processSaveAndReceipt(
                        totalAmount,
                        'Cash',
                        null,
                        result.value.tendered,
                        result.value.change.toFixed(2)
                    );
                } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                    // Back button — re-open the payment selection step
                    _showPaymentModal(totalAmount);
                }
            });
        }

        // ── STEP 2b: GCash payment modal (Simplified - one button) ──────────────────────────────────────
        function _showGCashModal(totalAmount, GCashRef) {
            Swal.fire({
                title: '<span style="color:#007bff;"><i class="fas fa-mobile-alt" style="margin-right:8px;"></i>GCash Payment</span>',
                html: `
            <style>
                .gcash-total-display {
                    background: linear-gradient(135deg, #e8f4fd, #d1ecf1);
                    border: 2px solid #bee5eb;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .gcash-total-label { font-size: 13px; color: #0c5460; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
                .gcash-total-amount { font-size: 32px; font-weight: 800; color: #007bff; margin-top: 4px; }
                .gcash-instructions {
                    background: #fff8e1;
                    border: 1px solid #ffe082;
                    border-radius: 10px;
                    padding: 12px 16px;
                    margin-bottom: 18px;
                    font-size: 13px;
                    color: #5d4037;
                    text-align: left;
                    line-height: 1.6;
                }
                .gcash-instructions b { color: #6F4E37; }
                .gcash-number-display {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    border-radius: 10px;
                    padding: 10px 18px;
                    display: inline-block;
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin: 6px 0 12px;
                }
                .payment-received-btn {
                    background: linear-gradient(135deg, #28a745, #218838);
                    border: none;
                    border-radius: 12px;
                    padding: 16px 24px;
                    width: 100%;
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .payment-received-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
                }
                .payment-received-btn:active {
                    transform: translateY(0);
                }
            </style>
            <div class="gcash-total-display">
                <div class="gcash-total-label">Amount to Send</div>
                <div class="gcash-total-amount">&#8369; ${totalAmount}.00</div>
            </div>
            <div class="gcash-instructions">
                <b>Instructions:</b><br>
                1. Customer sends <b>&#8369;${totalAmount}.00</b> to:<br>
                <div style="text-align:center;">
                    <div class="gcash-number-display">0917-828-0828</div>
                    <span style="font-size:12px; color:#888;">Account name: <b>828 Cafe</b></span>
                </div>
                2. After customer shows payment receipt, click the button below to complete the order.
            </div>
            <button type="button" class="payment-received-btn" id="paymentReceivedBtn">
                <i class="fas fa-check-circle"></i> Payment Received
            </button>
        `,
                showCancelButton: true,
                cancelButtonText: '<i class="fas fa-arrow-left"></i> Back',
                cancelButtonColor: '#6F4E37',
                showConfirmButton: false, // Hide the default confirm button
                width: 500,
                didOpen: () => {
                    const paymentBtn = document.getElementById('paymentReceivedBtn');

                    paymentBtn.addEventListener('click', () => {
                        // Auto-generate reference number for record keeping
                        $scope.autoRef = `1` + Math.floor(1000 + Math.random() * 9000000000);

                        // Close the modal and process the order
                        Swal.close();
                        _processSaveAndReceipt(totalAmount, 'GCash', $scope.autoRef, totalAmount, 0);
                    });
                }
            }).then((result) => {
                // If user clicks "Back", go back to payment selection
                if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                    _showPaymentModal(totalAmount, $scope.autoRef);
                }
            });
        }

        // ── STEP 2: Payment selection modal ──────────────────────────────────
        function _showPaymentModal(totalAmount, GCashRef) {
            Swal.fire({
                title: '<i class="fas fa-credit-card" style="color:#A8A54A;margin-right:8px;"></i>Select Payment Method',
                html: `
                    <style>
                        .payment-options {
                            display: flex;
                            gap: 16px;
                            justify-content: center;
                            margin: 10px 0 6px;
                        }
                        .payment-option-btn {
                            flex: 1;
                            max-width: 180px;
                            padding: 24px 16px;
                            border: 3px solid #dee2e6;
                            border-radius: 16px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.25s;
                            text-align: center;
                            font-weight: 700;
                            color: #2E2E2E;
                        }
                        .payment-option-btn:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
                        .payment-option-btn.selected { border-color: #A8A54A; background: rgba(168,165,74,0.08); box-shadow: 0 6px 18px rgba(168,165,74,0.25); }
                        .payment-option-btn i { font-size: 36px; display: block; margin-bottom: 10px; }
                        .payment-option-btn span { font-size: 15px; }
                        .payment-option-btn.cash i   { color: #28a745; }
                        .payment-option-btn.gcash i  { color: #007bff; }
                        .payment-total-row {
                            background: #f8f9fa;
                            border-radius: 10px;
                            padding: 12px 18px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                            border: 1px solid #dee2e6;
                        }
                        .payment-total-label { font-weight: 600; color: #6c757d; }
                        .payment-total-value { font-size: 22px; font-weight: 800; color: #6F4E37; }
                    </style>
                    <div class="payment-total-row">
                        <span class="payment-total-label">Order Total</span>
                        <span class="payment-total-value">&#8369; ${totalAmount}.00</span>
                    </div>
                    <div class="payment-options" id="paymentOptions">
                        <button type="button" class="payment-option-btn cash" data-method="Cash">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Cash</span>
                        </button>
                        <button type="button" class="payment-option-btn gcash" data-method="GCash">
                            <i class="fas fa-mobile-alt"></i>
                            <span>GCash</span>
                        </button>
                    </div>
                    <input type="hidden" id="selectedPayment" value="">
                `,
                showCancelButton: true,
                confirmButtonText: 'Next <i class="fas fa-arrow-right"></i>',
                cancelButtonText: '<i class="fas fa-arrow-left"></i> Review Order',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 460,
                didOpen: () => {
                    const btns = document.querySelectorAll('.payment-option-btn');
                    const hidden = document.getElementById('selectedPayment');
                    btns.forEach(btn => {
                        btn.addEventListener('click', function () {
                            btns.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                            hidden.value = this.getAttribute('data-method');
                        });
                    });
                },
                preConfirm: () => {
                    const method = document.getElementById('selectedPayment').value;
                    if (!method) {
                        Swal.showValidationMessage('Please select a payment method.');
                        return false;
                    }
                    return { method: method };
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    if (result.value.method === 'Cash') {
                        _showCashModal(totalAmount);
                    } else {
                        _showGCashModal(totalAmount, GCashRef);
                    }
                }
            });
        }

        // ── STEP 1: Order summary + confirm ──────────────────────────────────
        $scope.confirmOrderBtn = function () {
            if (currentOrder.length === 0) {
                Swal.fire({
                    title: 'Order is Empty',
                    text: 'Please add items to your order before confirming.',
                    icon: 'info',
                    confirmButtonColor: '#A8A54A'
                });
                return;
            }

            let orderSummary = 'Your Order:\n\n';
            let totalAmount = 0;

            currentOrder.forEach(item => {
                orderSummary += `• ${item.quantity}x ${item.name} - ₱${item.totalPrice}.00\n`;
                if (item.addons.length > 0) {
                    orderSummary += `  Add-ons: ${item.addons.map(a => a.name).join(', ')}\n`;
                }
                totalAmount += item.totalPrice;
            });

            orderSummary += `\nTotal: ₱${totalAmount}.00`;

            Swal.fire({
                title: 'Confirm Order?',
                html: `<pre style="text-align: left; white-space: pre-wrap; font-family: inherit;">${orderSummary}</pre>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Proceed to Payment <i class="fas fa-arrow-right"></i>',
                cancelButtonText: 'Review Order'
            }).then((result) => {
                if (result.isConfirmed) {
                    _showPaymentModal(totalAmount);
                }
            });
        }

        $scope.getProductDetails = function () {
            var getData = CoffeeShopService.getProductDetailsService();
            getData.then(function (returnedData) {
                $scope.products = returnedData.data.data;

                if (returnedData.data.success) {
                    // products loaded
                }
            });
        }

        $scope.getSalesSummary = function () {
            var getData = CoffeeShopService.getSalesSummaryService();

            getData.then(function (returnedData) {
                console.log("Returned sales summary:", returnedData.data);

                if (returnedData.data.success) {
                    var summary = returnedData.data.data;

                    if ($.fn.DataTable.isDataTable('#salesReportTable')) {
                        var table = $('#salesReportTable').DataTable();
                        table.clear();
                        table.rows.add(summary);
                        table.draw();
                    } else {
                        $('#salesReportTable').DataTable({
                            data: summary,
                            columns: [
                                { data: 'Date', title: 'Date' },
                                { data: 'TotalOrders', title: 'Total Orders' },
                                {
                                    data: 'TotalSales',
                                    title: 'Total Sales',
                                    render: function (data, type, row) {
                                        return '₱' + parseFloat(data).toFixed(2); // add peso symbol + 2 decimals
                                    }
                                },
                                {
                                    data: 'AvgOrderValue',
                                    title: 'Average Order Value',
                                    render: function (data, type, row) {
                                        return '₱' + parseFloat(data).toFixed(2); // add peso symbol + 2 decimals
                                    }
                                },
                                { data: 'TopProduct', title: 'Top Product' }
                            ],
                            paging: false,   // disable pagination
                            searching: false, // disable search box
                            info: false       // hide "Showing 1 to X of Y entries"
                        });
                    }
                }
            });
        };

        //Dashboard

        $scope.todaySales = 0;

        $scope.loadTodaySales = function () {
            CoffeeShopService.getTodaySales().then(function (response) {

                if (response.data.success) {
                    $scope.todaySales = response.data.totalSales;
                } else {
                    console.error(response.data.message);
                }

            }, function (error) {
                console.error("Error fetching today's sales:", error);
            });
        };


        $scope.loadTodaySales();



        // Function to load total orders today
        $scope.loadTotalOrdersToday = function () {
            CoffeeShopService.getTotalOrdersToday().then(response => {
                if (response.data.success) {
                    const statValue = document.getElementById('totalOrdersToday');
                    if (statValue) statValue.textContent = response.data.totalOrders;

                    const statChange = document.querySelector('.stat-change span');
                    if (statChange && response.data.totalOrdersYesterday !== undefined) {
                        const today = response.data.totalOrders;
                        const yesterday = response.data.totalOrdersYesterday;
                        let percentChange = 0;

                        if (yesterday > 0) {
                            percentChange = ((today - yesterday) / yesterday) * 100;
                        }

                        const arrow = percentChange >= 0 ? '▲' : '▼';
                        statChange.textContent = `${arrow} ${Math.abs(percentChange.toFixed(1))}% from yesterday`;

                        const statChangeDiv = document.querySelector('.stat-change');
                        statChangeDiv.classList.toggle('increase', percentChange >= 0);
                        statChangeDiv.classList.toggle('decrease', percentChange < 0);
                    }
                } else {
                    console.error("Error fetching total orders:", response.data.message);
                }
            }).catch(err => {
                console.error("Server error fetching total orders:", err);
            });
        };

        $scope.loadTotalOrdersToday();



        $scope.loadTopSellingItemToday = function () {
            CoffeeShopService.getTopSellingItemToday().then(response => {
                if (response.data.success) {
                    const statValue = document.querySelector('.stat-items .stat-value');
                    const statChange = document.querySelector('.stat-items .stat-change span');

                    if (statValue) statValue.textContent = response.data.productName;
                    if (statChange) statChange.textContent = `${response.data.totalSold} sold`;
                } else {
                    console.error("Error fetching top selling item:", response.data.message);
                }
            }).catch(err => {
                console.error("Server error fetching top selling item:", err);
            });
        };

        $scope.loadTopSellingItemToday();


        //Charts
        $scope.loadCharts = function () {

            // --- Category Chart ---
            $scope.loadCategoryChart = function () {
                CoffeeShopService.getSalesByCategory().then(function (res) {
                    const labels = res.data.map(x => x.Category);
                    const data = res.data.map(x => x.TotalSales);

                    const ctx = document.getElementById('categoryChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: ['#A8A54A', '#6F4E37', '#D8D5B5', '#5C412F', '#F4F3EC', '#2E2E2E', '#9C8A5B']
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                        }
                    });
                }).catch(err => console.error("Error fetching sales by category:", err));
            };

            //Weekly Chart
            $scope.loadWeeklyChart = function () {
                CoffeeShopService.getWeeklySales().then(function (response) {
                    if (response.data.success) {

                        const raw = response.data.data;

                        // Use the day names directly from API
                        const labels = raw.map(d => d.Day);
                        const data = raw.map(d => d.Total);

                        const ctx = document.getElementById('weeklyChart').getContext('2d');

                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'Revenue (₱)',
                                    data: data,
                                    borderColor: '#A8A54A',
                                    backgroundColor: 'rgba(168, 165, 74, 0.1)',
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: value => '₱' + value
                                        }
                                    }
                                }
                            }
                        });

                    } else {
                        console.error("Failed to load weekly sales:", response.data.message);
                    }
                }).catch(err => console.error("Error fetching weekly sales:", err));
            };

            // --- Monthly Sales Chart ---
            $scope.loadMonthlyChart = function () {
                CoffeeShopService.getMonthlySales().then(function (response) {
                    if (response.data.success) {
                        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const data = monthLabels.map((m, index) => {
                            const match = response.data.data.find(x => x.Month === index + 1);
                            return match ? match.Total : 0;
                        });

                        const ctx = document.getElementById('monthlyChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: monthLabels,
                                datasets: [{
                                    label: 'Monthly Sales',
                                    data: data,
                                    backgroundColor: '#A8A54A',
                                    borderColor: '#6F4E37',
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: { callback: value => '₱' + (value / 1000) + 'K' }
                                    }
                                }
                            }
                        });
                    } else {
                        console.error("Failed to load monthly sales:", response.data.message);
                    }
                }).catch(err => console.error("Error fetching monthly sales:", err));
            };

            // --- Traffic Chart ---
            $scope.loadTrafficChart = function () {
                CoffeeShopService.getTrafficData().then(function (response) {
                    if (response.data.success) {
                        const labels = response.data.data.map(slot => {
                            const start = slot.StartHour;
                            const formatHour = h => (h % 12 === 0 ? 12 : h % 12) + (h < 12 || h === 24 ? 'AM' : 'PM');
                            return formatHour(start);
                        });
                        const data = response.data.data.map(slot => slot.Count);

                        const ctx = document.getElementById('trafficChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'Customer Traffic',
                                    data: data,
                                    backgroundColor: '#6F4E37',
                                    borderColor: '#A8A54A',
                                    borderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { ticks: { autoSkip: false } },
                                    y: {
                                        beginAtZero: true,
                                        title: { display: true, text: 'Number of Customers' }
                                    }
                                },
                                plugins: { legend: { display: false } }
                            }
                        });
                    } else {
                        console.error("Failed to load traffic data:", response.data.message);
                    }
                }).catch(err => console.error("Error fetching traffic data:", err));
            };

            // --- Call all chart loaders ---
            $scope.loadCategoryChart();
            $scope.loadWeeklyChart();
            $scope.loadMonthlyChart();
            $scope.loadTrafficChart();
        };

        // Call this on dashboard load
        $scope.loadCharts();



        $scope.createProductCard = function (product) {
            console.log(product);

            // If product is out of stock
            if (product.ProductQuantity <= 0) {
                console.log(product);

                return `
                    <div class="product-card out-of-stock" data-category="${product.ProductCategory}">
                        <div class="product-image">
                            <img src="${product.Productpicpath}" alt="${product.Productname}">
                            <span class="product-category">Out of Stock</span>
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.Productname}</h3>
                            <div class="product-price" style="margin-bottom: 0;">&#8369; ${product.Productprice}.00</div>
                            
                            <div class="product-actions">
                                <button class="add-to-cart disabled" disabled>
                                    <i class="fas fa-ban"></i>
                                    Not Available
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // If product is in stock
            return `
                <div class="product-card" data-category="${product.ProductCategory}">
                    <div class="product-image">
                        <img src="${product.Productpicpath}" alt="${product.Productname}">
                        <span class="product-category">${product.ProductCategory}</span>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.Productname}</h3>
                        <div class="product-price">&#8369; ${product.Productprice}.00</div>
                        <div class="product-actions">
                            <button class="add-to-cart" ng-click="showOrderModal(${product.ProductID})">
                                <i class="fas fa-cart-plus"></i>
                                ADD TO ORDER
                            </button>
                        </div>
                    </div>
                </div>
            `;
        };

        $scope.tempItemQuantity = 0;
        $scope.tempRemainingQuantity = 0;

        $scope.showOrderModal = function (productID) {
            const product = $scope.products.find(p => p.ProductID === productID);

            // Check if product category is a drink category (coffee, non-coffee, frappes)
            const drinkCategories = ["coffee", "non-coffee", "frappes"];
            const isDrink = drinkCategories.includes(product.ProductCategory?.toLowerCase());

            let html = `
    <div class="order-form-group">
        <label class="order-form-label">Quantity</label>
        <input type="number" id="quantity" class="order-form-input" value="1" min="1" max="10">
    </div>`;

            // Add Drink Type section if product is a drink
            if (isDrink) {
                html += `
    <div class="order-form-group">
        <label class="order-form-label">Drink Type</label>
        <div class="button-group" id="drinkTypeGroup">
            <button type="button" class="option-btn selected" data-value="Hot">Hot</button>
            <button type="button" class="option-btn" data-value="Cold">Cold</button>
        </div>
    </div>`;
            }

            html += `
    <div class="order-form-group">
        <label class="order-form-label">Order Type</label>
        <div class="button-group" id="orderTypeGroup">
            <button type="button" class="option-btn selected" data-value="dine-in">Dine In</button>
            <button type="button" class="option-btn" data-value="takeout">Takeout</button>
        </div>
    </div>
    <div class="order-form-group">
        <label class="order-form-label">Add-ons (Optional)</label>
        <div class="addons-container" id="addonsContainer">`;

            if (product.ProductAddOns && product.ProductAddOns.length > 0) {
                product.ProductAddOns.forEach(addon => {
                    html += `
            <div class="addon-item" id="addonItem-${addon.addonID}">
                <input type="checkbox" id="addon-${addon.addonID}" class="addon-checkbox" value="${addon.addonID}" data-name="${addon.addonName}" data-price="${addon.addonPrice}">
                <label for="addon-${addon.addonID}" class="addon-label">${addon.addonName} (+&#8369; ${addon.addonPrice})</label>
            </div>`;
                });
            } else {
                html += `<div class="no-addons-message" style="grid-column: span 2; text-align: center; padding: 20px;">No add-ons available for this product.</div>`;
            }

            html += `</div></div>`;

            Swal.fire({
                title: `Add ${product.Productname}`,
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Add to Order',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 600,
                padding: '3em',
                backdrop: `rgba(111, 78, 55, 0.1)`,
                didOpen: () => {
                    // Drink Type selection (if applicable)
                    const drinkTypeButtons = document.querySelectorAll('#drinkTypeGroup .option-btn');
                    drinkTypeButtons.forEach(btn => {
                        btn.addEventListener('click', function () {
                            drinkTypeButtons.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                        });
                    });

                    // Order Type selection
                    const orderTypeButtons = document.querySelectorAll('#orderTypeGroup .option-btn');
                    orderTypeButtons.forEach(btn => {
                        btn.addEventListener('click', function () {
                            orderTypeButtons.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                        });
                    });

                    // Add-ons checkboxes
                    const checkboxes = document.querySelectorAll('.addon-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', function () {
                            const addonItem = this.closest('.addon-item');
                            if (this.checked) {
                                addonItem.classList.add('selected');
                            } else {
                                addonItem.classList.remove('selected');
                            }
                        });
                    });
                },
                preConfirm: () => {
                    const quantity = parseInt(document.getElementById('quantity').value);
                    if (quantity < 1 || quantity > 100) {
                        Swal.showValidationMessage('Please enter a quantity between 1 and 100');
                        return false;
                    }

                    // Get drink type if product is a drink
                    let drinkType = null;
                    if (isDrink) {
                        const selectedDrinkType = document.querySelector('#drinkTypeGroup .option-btn.selected');
                        drinkType = selectedDrinkType ? selectedDrinkType.getAttribute('data-value') : 'hot';
                        console.log('Selected Drink Type:', drinkType);
                    }

                    const selectedOrderType = document.querySelector('#orderTypeGroup .option-btn.selected');
                    const orderType = selectedOrderType ? selectedOrderType.getAttribute('data-value') : 'dine-in';

                    let selectedAddons = [];
                    const checkboxes = document.querySelectorAll('.addon-checkbox:checked');
                    checkboxes.forEach(checkbox => {
                        selectedAddons.push({
                            id: parseInt(checkbox.value),
                            name: checkbox.getAttribute('data-name'),
                            price: parseInt(checkbox.getAttribute('data-price'))
                        });
                    });

                    // Calculate total quantity of ALL drink types for this product (hot + cold combined)
                    let totalInCart = 0;
                    currentOrder.forEach(item => {
                        if (item.productId === productID) {
                            totalInCart += item.quantity; // Add both hot and cold quantities
                        }
                    });

                    return CoffeeShopService.getProductQuantityService(productID).then(returnedData => {
                        const maxStock = returnedData.data.quantity;
                        const requestedQuantity = quantity;
                        const totalAfterAdding = totalInCart + requestedQuantity;

                        console.log(`Total in cart (all types): ${totalInCart}, Requested: ${requestedQuantity}, Total after: ${totalAfterAdding}, Max stock: ${maxStock}`);

                        if (totalAfterAdding > maxStock) {
                            const remainingStock = maxStock - totalInCart;
                            if (remainingStock <= 0) {
                                Swal.showValidationMessage(`Cannot add more. You've already ordered the maximum available stock (${maxStock}) across all drink types.`);
                            } else {
                                Swal.showValidationMessage(`Only ${remainingStock} more available. You already have ${totalInCart} ${product.Productname}(s) in your order across Hot & Cold.`);
                            }
                            return false;
                        }

                        const orderObject = {
                            productId: productID,
                            quantity: quantity,
                            drinkType: drinkType,
                            orderType: orderType,
                            addons: selectedAddons,
                            maxStock: maxStock,
                            totalInCart: totalInCart
                        };

                        console.log('Final Order Object:', orderObject);
                        return orderObject;
                    }).catch((error) => {
                        console.error("Error fetching product quantity:", error);
                        Swal.showValidationMessage('Server error, please try again');
                        return false;
                    });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Check stock again
                    CoffeeShopService.getProductQuantityService(productID).then(function (returnedData) {
                        const maxStock = returnedData.data.quantity;

                        // Calculate total quantity of ALL drink types for this product
                        let totalInCart = 0;
                        currentOrder.forEach(item => {
                            if (item.productId === productID) {
                                totalInCart += item.quantity;
                            }
                        });

                        const newQuantity = result.value.quantity;
                        const totalAfterAdding = totalInCart + newQuantity;

                        if (totalAfterAdding > maxStock) {
                            const remainingStock = maxStock - totalInCart;

                            if (remainingStock <= 0) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Cannot Add to Order',
                                    text: `You've already ordered the maximum available stock (${maxStock}) for this item across all drink types.`,
                                    confirmButtonColor: '#A8A54A'
                                });
                            } else {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Stock Limit Reached',
                                    text: `You requested ${newQuantity}, but only ${remainingStock} more available across all drink types. Adding ${remainingStock} instead.`,
                                    confirmButtonColor: '#A8A54A'
                                }).then(() => {
                                    result.value.quantity = remainingStock;
                                    $scope.addToOrder(result.value);
                                });
                            }
                            return;
                        }

                        // Within stock limit
                        $scope.addToOrder(result.value);
                    }).catch((error) => {
                        console.error("Error in final stock check:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to verify stock. Please try again.',
                            confirmButtonColor: '#A8A54A'
                        });
                    });
                }
            });
        }

        $scope.addToOrder = function (orderData) {
            console.log(currentOrder);
            const product = $scope.products.find(p => p.ProductID === orderData.productId);

            let addonsTotal = 0;
            orderData.addons.forEach(addon => {
                addonsTotal += addon.price;
            });

            const totalPrice = (product.Productprice + addonsTotal) * orderData.quantity;

            const orderItem = {
                productId: product.ProductID,
                name: product.Productname,
                category: product.ProductCategory,
                image: product.Productpicpath,
                quantity: orderData.quantity,
                drinkType: orderData.drinkType || null,
                orderType: orderData.orderType,
                addons: orderData.addons,
                unitPrice: product.Productprice,
                addonsPrice: addonsTotal,
                totalPrice: totalPrice
            };

            // Find existing item with matching productId, orderType, drinkType, AND addons
            const existingIndex = currentOrder.findIndex(item =>
                item.productId === orderItem.productId &&
                item.orderType === orderItem.orderType &&
                item.drinkType === orderItem.drinkType && // This ensures hot and cold are separate
                JSON.stringify(item.addons.map(a => a.id).sort()) ===
                JSON.stringify(orderItem.addons.map(a => a.id).sort())
            );

            if (existingIndex > -1) {
                currentOrder[existingIndex].quantity += orderItem.quantity;
                currentOrder[existingIndex].totalPrice =
                    (currentOrder[existingIndex].unitPrice + currentOrder[existingIndex].addonsPrice) *
                    currentOrder[existingIndex].quantity;
            } else {
                currentOrder.push(orderItem);
            }

            $scope.updateOrderDisplay();
            updateCartBadge();

            const drinkTypeText = orderItem.drinkType ? (orderItem.drinkType === 'hot' ? 'Hot' : 'Cold') : '';
            Swal.fire({
                title: 'Added to Order!',
                text: `${orderItem.quantity}x ${product.Productname}${drinkTypeText ? ' (' + drinkTypeText + ')' : ''} added to your order.`,
                icon: 'success',
                confirmButtonColor: '#A8A54A'
            });
        };

        $scope.updateOrderDisplay = function () {
            const orderItemsContainer = document.getElementById('orderItems');
            const totalAmountElement = document.getElementById('totalAmount');

            if (currentOrder.length === 0) {
                orderItemsContainer.innerHTML = `
    <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Your cart is empty</p>
        <p>Add items from the menu to get started</p>
    </div>`;
                totalAmountElement.innerHTML = '&#8369; 0.00';
                updateCartBadge();
                return;
            }

            let totalAmount = 0;
            let orderItemsHTML = '';

            // Define drink categories
            const drinkCategories = ["coffee", "non-coffee", "frappes"];

            currentOrder.forEach((item, index) => {
                totalAmount += item.totalPrice;

                let details = [];
                details.push(item.orderType.charAt(0).toUpperCase() + item.orderType.slice(1));

                if (item.addons && item.addons.length > 0) {
                    details.push('Add-ons: ' + item.addons.map(a => a.name).join(', '));
                }

                // Create a unique ID for this order item to help with DOM manipulation
                const itemId = `order-item-${index}-${Date.now()}`;

                // Check if the item is a drink and has drinkType property
                const isDrink = drinkCategories.includes(item.category?.toLowerCase()) && item.drinkType;

                // Format the item name with drink type if applicable
                let displayName = item.name;
                if (isDrink && item.drinkType) {
                    const drinkTypeDisplay = item.drinkType === 'hot' ? 'Hot' : item.drinkType === 'cold' ? 'Cold' : item.drinkType;
                    displayName = `${item.name} (${drinkTypeDisplay})`;
                }

                orderItemsHTML += `
    <div class="order-item" data-id="${item.productId}" data-index="${index}" id="${itemId}">
        <div class="order-item-image">
            <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="order-item-details">
            <div class="order-item-name">${displayName}</div>
            <div class="order-item-info">${details.join(' | ')}</div>
            <div class="order-item-price">&#8369; ${item.totalPrice}.00</div>
            <div class="order-item-quantity">
                <button class="quantity-btn" data-action="decrease" data-product-id="${item.productId}" data-index="${index}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-action="increase" data-product-id="${item.productId}" data-index="${index}">+</button>
            </div>
        </div>
        <div class="order-item-actions">
            <button class="order-item-action-btn edit-btn" data-action="edit" data-index="${index}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="order-item-action-btn delete-btn" data-action="delete" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
`;
            });

            // Set the HTML
            orderItemsContainer.innerHTML = orderItemsHTML;
            totalAmountElement.innerHTML = `&#8369; ${totalAmount}.00`;
            updateCartBadge();

            // Attach event listeners directly instead of using ng-click
            setTimeout(() => {
                // Quantity buttons
                document.querySelectorAll('.quantity-btn').forEach(btn => {
                    btn.removeEventListener('click', handleQuantityClick);
                    btn.addEventListener('click', handleQuantityClick);
                });

                // Edit buttons
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.removeEventListener('click', handleEditClick);
                    btn.addEventListener('click', handleEditClick);
                });

                // Delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.removeEventListener('click', handleDeleteClick);
                    btn.addEventListener('click', handleDeleteClick);
                });
            }, 0);
        };

        // Event handlers
        function handleQuantityClick(event) {
            event.stopPropagation();
            const btn = event.currentTarget;
            const productId = parseInt(btn.getAttribute('data-product-id'));
            const index = parseInt(btn.getAttribute('data-index'));
            const action = btn.getAttribute('data-action');
            const change = action === 'increase' ? 1 : -1;

            $scope.$apply(() => {
                $scope.updateQuantity(productId, index, change);
            });
        }

        function handleEditClick(event) {
            event.stopPropagation();
            const index = parseInt(event.currentTarget.getAttribute('data-index'));
            $scope.$apply(() => {
                $scope.editOrderItem(index);
            });
        }

        function handleDeleteClick(event) {
            event.stopPropagation();
            const index = parseInt(event.currentTarget.getAttribute('data-index'));
            $scope.$apply(() => {
                $scope.deleteOrderItem(index);
            });
        }

        $scope.loadAllProductsSales = function () {
            CoffeeShopService.getAllProductsSales().then(response => {
                if (response.data.success) {
                    const listContainer = document.querySelector('.top-products-list');
                    listContainer.innerHTML = ''; // Clear existing items

                    response.data.products.forEach((product, index) => {
                        const li = document.createElement('li');
                        li.className = 'top-product-item';

                        li.innerHTML = `
               <div class="product-rank product-rank-${index + 1}">${index + 1}</div>
               <div class="product-info">
                   <div class="product-name">${product.Productname}</div>
                   <div class="product-sales">${product.TotalSold} sold • ₱${product.TotalRevenue.toFixed(2)} revenue</div>
               </div>
           `;

                        listContainer.appendChild(li);
                    });
                } else {
                    console.error("Error fetching products:", response.data.message);
                }
            }).catch(err => {
                console.error("Server error fetching products:", err);
            });
        };

        $scope.loadAllProductsSales();





        $scope.deleteOrderItem = function (index) {
            currentOrder.splice(index, 1);
            $scope.updateOrderDisplay();
            updateCartBadge();

            Swal.fire({
                title: 'Removed from Order',
                text: 'Item has been removed from your order.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        };

        $scope.updateQuantity = function (productID, index, change) {
            const currentItem = currentOrder[index];
            let newQuantity = currentItem.quantity + change;

            // Don't allow quantity less than 1
            if (newQuantity < 1) {
                $scope.deleteOrderItem(index);
                return;
            }

            // Check stock availability
            CoffeeShopService.getProductQuantityService(productID)
                .then(function (returnedData) {
                    const maxStock = returnedData.data.quantity;

                    // Calculate total quantity of ALL drink types for this product (hot + cold combined)
                    let totalInCart = 0;
                    currentOrder.forEach(item => {
                        if (item.productId === productID) {
                            totalInCart += item.quantity; // Add both hot and cold quantities
                        }
                    });

                    // If we're increasing quantity, check if new total would exceed stock
                    if (change > 0) {
                        const totalAfterUpdate = totalInCart + change;
                        if (totalAfterUpdate > maxStock) {
                            const remainingStock = maxStock - (totalInCart - currentItem.quantity);
                            Swal.fire({
                                icon: 'warning',
                                title: 'Stock Limit Reached',
                                text: `Cannot add more. Only ${maxStock} total available across all drink types. You currently have ${totalInCart - currentItem.quantity} ${currentItem.name} in your order (across Hot & Cold).`,
                                confirmButtonColor: '#A8A54A'
                            });
                            return; // Don't update quantity
                        }
                    }

                    // If decreasing quantity or within stock limit, proceed with update
                    if (newQuantity < 1) {
                        $scope.deleteOrderItem(index);
                        return;
                    }

                    // Update order object
                    currentOrder[index].quantity = newQuantity;
                    currentOrder[index].totalPrice =
                        (currentOrder[index].unitPrice + currentOrder[index].addonsPrice) * newQuantity;

                    // Update the display
                    $scope.updateOrderDisplay();
                    updateCartBadge();

                    // Show success feedback for increase (optional)
                    if (change > 0) {
                        Swal.fire({
                            title: 'Quantity Updated',
                            text: `Updated ${currentItem.name} (${currentItem.drinkType === 'hot' ? 'Hot' : 'Cold'}) quantity to ${newQuantity}`,
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error checking stock:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: "Unable to verify stock availability. Please try again.",
                        confirmButtonColor: '#A8A54A'
                    });
                });
        };

        // =====================================================================
        // FIX: editOrderItem - item is only removed if the user CONFIRMS the edit.
        //      If the user cancels, the original item stays in the cart.
        // =====================================================================
        $scope.editOrderItem = function (index) {
            const item = currentOrder[index];
            const product = $scope.products.find(p => p.ProductID === item.productId);

            // ── Pre-fill values from the existing item ──
            let html = `
        <div class="order-form-group">
            <label class="order-form-label">Quantity</label>
            <input type="number" id="quantity" class="order-form-input"
                   value="${item.quantity}" min="1">
        </div>
        <div class="order-form-group">
            <label class="order-form-label">Order Type</label>
            <div class="button-group" id="orderTypeGroup">
                <button type="button" class="option-btn ${item.orderType === 'dine-in' ? 'selected' : ''}"
                        data-value="dine-in">Dine In</button>
                <button type="button" class="option-btn ${item.orderType === 'takeout' ? 'selected' : ''}"
                        data-value="takeout">Takeout</button>
            </div>
        </div>
        <div class="order-form-group">
            <label class="order-form-label">Add-ons (Optional)</label>
            <div class="addons-container" id="addonsContainer">`;

            const selectedAddonIds = item.addons.map(a => a.id);
            product.ProductAddOns.forEach(addon => {
                const isChecked = selectedAddonIds.includes(addon.addonID);
                html += `
            <div class="addon-item ${isChecked ? 'selected' : ''}" id="addonItem-${addon.addonID}">
                <input type="checkbox" id="addon-${addon.addonID}" class="addon-checkbox"
                       value="${addon.addonID}"
                       data-name="${addon.addonName}"
                       data-price="${addon.addonPrice}"
                       ${isChecked ? 'checked' : ''}>
                <label for="addon-${addon.addonID}" class="addon-label">
                    ${addon.addonName} (+₱${addon.addonPrice})
                </label>
            </div>`;
            });

            html += `</div></div>`;

            Swal.fire({
                title: `Edit ${product.Productname}`,
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 600,
                padding: '3em',
                backdrop: `rgba(111, 78, 55, 0.1)`,
                didOpen: () => {
                    const orderTypeButtons = document.querySelectorAll('#orderTypeGroup .option-btn');
                    orderTypeButtons.forEach(btn => {
                        btn.addEventListener('click', function () {
                            orderTypeButtons.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                        });
                    });

                    const checkboxes = document.querySelectorAll('.addon-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', function () {
                            const addonItem = this.closest('.addon-item');
                            if (this.checked) {
                                addonItem.classList.add('selected');
                            } else {
                                addonItem.classList.remove('selected');
                            }
                        });
                    });
                },
                preConfirm: () => {
                    const quantity = parseInt(document.getElementById('quantity').value);

                    // 🔹 Validate against stock using your service
                    return CoffeeShopService.getProductQuantityService(item.productId)
                        .then(returnedData => {
                            const success = returnedData.data.success;
                            const maxStock = returnedData.data.quantity;

                            if (!success) {
                                Swal.showValidationMessage('Error checking stock');
                                return false;
                            }

                            if (quantity < 1) {
                                Swal.showValidationMessage('Quantity must be at least 1');
                                return false;
                            }

                            if (quantity > maxStock) {
                                Swal.showValidationMessage(`Reached max stock (${maxStock}) for this product`);
                                return false;
                            }

                            const selectedOrderType = document.querySelector('#orderTypeGroup .option-btn.selected');
                            const orderType = selectedOrderType ? selectedOrderType.getAttribute('data-value') : 'dine-in';

                            let selectedAddons = [];
                            const checkboxes = document.querySelectorAll('.addon-checkbox:checked');
                            checkboxes.forEach(checkbox => {
                                selectedAddons.push({
                                    id: parseInt(checkbox.value),
                                    name: checkbox.getAttribute('data-name'),
                                    price: parseInt(checkbox.getAttribute('data-price'))
                                });
                            });

                            return {
                                productId: item.productId,
                                quantity: quantity,
                                orderType: orderType,
                                addons: selectedAddons
                            };
                        })
                        .catch(() => {
                            Swal.showValidationMessage('Error validating stock');
                            return false;
                        });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    const updatedData = result.value;
                    let addonsTotal = 0;
                    updatedData.addons.forEach(addon => { addonsTotal += addon.price; });

                    currentOrder[index] = {
                        ...item,
                        quantity: updatedData.quantity,
                        orderType: updatedData.orderType,
                        addons: updatedData.addons,
                        addonsPrice: addonsTotal,
                        totalPrice: (item.unitPrice + addonsTotal) * updatedData.quantity
                    };

                    $scope.updateOrderDisplay();
                    updateCartBadge();

                    Swal.fire({
                        title: 'Item Updated!',
                        text: `${item.name} has been updated in your order.`,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        };

        // Function to delete order item
        $scope.deleteOrderItem = function (index) {
            Swal.fire({
                title: 'Remove Item?',
                text: `Remove ${currentOrder[index].name} from your order?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Yes, remove it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    currentOrder.splice(index, 1);
                    $scope.updateOrderDisplay();
                    Swal.fire(
                        'Removed!',
                        'Item has been removed from your order.',
                        'success'
                    );
                }
            });
        }

        $scope.populateCategory = function (category, gridId) {

            const grid = document.getElementById(gridId);

            if (!grid) return;

            grid.innerHTML = '';

            let filteredProducts;
            if (category == 'allItems') {
                filteredProducts = $scope.products;
            } else {
                filteredProducts = $scope.products.filter(product => product.ProductCategory === category);
                console.log(filteredProducts);
            }
            console.log(filteredProducts);
            if (filteredProducts.length === 0) {
                grid.innerHTML = `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <i class="fas fa-${categoryInfo[category].icon}"></i>
                            <h3>NO ITEMS AVAILABLE</h3>
                            <p>This category is currently empty. Please check back later.</p>
                        </div>
                    `;
            } else {

                filteredProducts.forEach(product => {
                    var cardHtml = $scope.createProductCard(product);
                    var compiled = $compile(cardHtml)($scope);
                    angular.element(grid).append(compiled);
                });
            }
        }

        $scope.populateOrderHistory = function () {
            const tableBody = document.getElementById('historyTableBody');
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (orderHistory.length === 0) {
                tableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 50px;">
                                <i class="fas fa-history" style="font-size: 40px; color: var(--color-light); margin-bottom: 15px; display: block;"></i>
                                <p style="color: var(--color-text); opacity: 0.7;">No order history available.</p>
                            </td>
                        </tr>`;
                return;
            }

            orderHistory.forEach((order, index) => {
                const itemsText = order.items.map(item =>
                    `${item.quantity}x ${item.name}${item.addons.length > 0 ? ' (+' + item.addons.join(', ') + ')' : ''}`
                ).join(', ');

                let statusClass = 'status-pending';
                if (order.status === 'completed') statusClass = 'status-completed';
                if (order.status === 'preparing') statusClass = 'status-preparing';
                if (order.status === 'voided') statusClass = 'status-voided';

                const row = document.createElement('tr');
                row.innerHTML = `
                        <td><strong>${order.id}</strong></td>
                        <td>${order.date}</td>
                        <td>${itemsText}</td>
                        <td>&#8369;${order.total}.00</td>
                        <td>
                            ${order.status === 'voided' ?
                        `<span class="order-status ${statusClass}">Voided</span>` :
                        `<select class="status-select" onchange="updateOrderStatus(${index}, this.value)" ${order.status === 'voided' ? 'disabled' : ''}>
                                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                </select>`
                    }
                        </td>
                        <td>
                            <div class="order-actions-cell">
                                <button class="history-action-btn view-details-btn" onclick="viewOrderDetails(${index})">
                                    <i class="fas fa-eye"></i>
                                    View Details
                                </button>
                                ${order.status !== 'voided' ? `
                                    <button class="history-action-btn void-order-btn" onclick="voidOrder(${index})">
                                        <i class="fas fa-ban"></i>
                                        Void Order
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    `;
                tableBody.appendChild(row);
            });
        }

        $scope.showCategory = function (category) {
            document.getElementById('placeholderContent').style.display = 'none';
            document.getElementById('allItemsContent').style.display = 'none';
            document.getElementById('coffeeContent').style.display = 'none';
            document.getElementById('nonCoffeeContent').style.display = 'none';
            document.getElementById('frappesContent').style.display = 'none';
            document.getElementById('pastasContent').style.display = 'none';
            document.getElementById('sandwichesContent').style.display = 'none';
            document.getElementById('nachosContent').style.display = 'none';
            document.getElementById('crofflesContent').style.display = 'none';
            document.getElementById('pastryContent').style.display = 'none';
            document.getElementById('historyContent').style.display = 'none';
            document.getElementById('emptyContent').style.display = 'none';

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            const activeLink = document.querySelector(`.nav-link[data-category="${category}"]`) ||
                document.getElementById('logoutBtn');
            if (activeLink) activeLink.classList.add('active');

            if (category === 'logout') {
                return;
            }

            if (category === 'history') {
                document.getElementById('historyContent').style.display = 'block';
                $scope.populateOrderHistory();
            } else {
                const contentDiv = document.getElementById(`${category}Content`);
                if (contentDiv) {
                    contentDiv.style.display = 'block';
                    if (categoryInfo[category]) {
                        contentDiv.innerHTML = $scope.createCategoryTemplate(category);
                        $scope.populateCategory(category, `${category}Grid`);
                    }
                }
            }
        }

        $scope.createCategoryTemplate = function (category) {
            const info = categoryInfo[category];
            return `
                        <div class="category-header">
                            <h2 class="category-title">
                                <i class="fas ${info.icon}"></i>
                                ${info.title}
                            </h2>
                            <p class="category-description">
                                ${info.description}
                            </p>
                        </div>
                        <div class="category-grid" id="${category}Grid">
                            <!-- Items will be populated by JavaScript -->
                        </div>
                    `;
        }

        $scope.initializeCategories = function () {
            angular.forEach($scope.categoryInfo, function (info, category) {
                if (category !== 'all') {
                    var contentDiv = document.getElementById(category + "Content");
                    if (contentDiv) {
                        var template = $scope.createCategoryTemplate(category);
                        var compiled = $compile(template)($scope);
                        angular.element(contentDiv).append(compiled);
                    }
                }
            });
        };

        $scope.redirectPage = function (page) {
            if (page === "LoginPage") {
                window.location.href = '/CoffeeShop/LoginPage';
            }
        }

        $scope.completeSignup = function () {
            if (!validateForm()) return;

            const adminData = {
                Adminname: document.getElementById('fullName').value,
                Adminemail: document.getElementById('email').value,
                Adminpassword: document.getElementById('password').value
            };

            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';

            var getData = CoffeeShopService.addAdminService(adminData);
            getData.then(function (returnedData) {
                $scope.products = returnedData.data.data;
                if (returnedData.data.success) {
                    // signup success
                }
            });

            Swal.fire({
                title: 'Account Created!',
                text: `Welcome to 828 Cafe, ${adminData.fullName}!`,
                icon: 'success',
                confirmButtonColor: '#A8A54A',
                timer: 3000,
                showConfirmButton: true
            });
        }

        $scope.redirectToLogin = function () {
            Swal.fire({
                title: 'Redirecting...',
                text: 'Taking you to the login page.',
                icon: 'info',
                confirmButtonColor: '#A8A54A'
            }).then(() => {
                window.location.href = '/CoffeeShop/LoginPage';
                console.log('Redirecting to login page...');
            });
        }

        $scope.sessionExpirationOTP = function () {
            CoffeeShopService.sessionExpirationOTP()
                .then(function (response) {
                    var otp = response.data.otp;
                    if (otp === "") {
                        alert("OTP Expired");
                    } else {
                        //alert("Session is not null!");
                    }
                });
        };

        $scope.handleLogout = function () {
            Swal.fire({
                title: 'Logout?',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Yes, logout!',
                cancelButtonText: 'Stay logged in',
                backdrop: 'rgba(111, 78, 55, 0.1)'
            }).then((result) => {
                if (result.isConfirmed) {
                    // If employee is logged in, update logout status first
                    if ($scope.userType === 'Employee' && $scope.employeeid) {
                        CoffeeShopService.employeeLogout($scope.employeeid)
                            .then(function () {
                                // Proceed with session removal
                                return CoffeeShopService.removeUserSession();
                            })
                            .then(function (response) {
                                if (response.data.success) {
                                    Swal.fire({
                                        title: 'Logged Out!',
                                        text: 'You have been successfully logged out.',
                                        icon: 'success',
                                        confirmButtonColor: '#A8A54A',
                                        timer: 1500,
                                        showConfirmButton: false
                                    }).then(() => {
                                        window.location.href = "/CoffeeShop/LoginPage";
                                    });
                                }
                            });
                    } else {
                        // Admin logout or direct session removal
                        $scope.removeUserSession();
                        Swal.fire({
                            title: 'Logged Out!',
                            text: 'You have been successfully logged out.',
                            icon: 'success',
                            confirmButtonColor: '#A8A54A',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.href = "/CoffeeShop/LoginPage";
                        });
                    }
                }
            });
        };

        //Add employee
        $scope.showAddEmployeeModal = function () {

            // Email validation helper function
            function isValidEmail(email) {
                const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
                return emailRegex.test(email);
            }

            const html = `
    <div class="form-header">
        <div class="form-header-icon">
            <i class="fas fa-user-plus"></i>
        </div>
        <div class="form-header-text">
            <div class="form-header-title">Add New Employee</div>
            <div class="form-header-subtitle">Fill in the employee details below</div>
        </div>
    </div>
    
    <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input type="text" id="employeeName" class="form-input" placeholder="e.g., Juan Dela Cruz" required maxlength="50">
    </div>
    
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Contact Number *</label>
            <input type="tel" id="employeeContact" class="form-input" placeholder="09123456789" required>
            <span class="form-note">Format: 09XXXXXXXXX (11 digits)</span>
        </div>
        <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="employeeEmail" class="form-input" placeholder="employee@828cafe.com" required maxlength="50">
            <span class="form-note" id="emailFormatError" style="color: #dc3545; display: none; font-size: 12px;">Please enter a valid email address (e.g., name@domain.com)</span>
            <span class="form-note" id="emailDuplicateError" style="color: #dc3545; display: none; font-size: 12px;">This email is already registered</span>
        </div>
    </div>
    
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Password *</label>
            <div class="password-wrapper">
                <input type="password" id="employeePassword" class="form-input" placeholder="Enter password" required maxlength="50">
                <i class="fas fa-eye toggle-password" data-target="employeePassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
            </div>
            <span class="form-note">Password must be at least 6 characters</span>
        </div>
        <div class="form-group">
            <label class="form-label">Confirm Password *</label>
            <div class="password-wrapper">
                <input type="password" id="employeeConfirmPassword" class="form-input" placeholder="Confirm password" required maxlength="50">
                <i class="fas fa-eye toggle-password" data-target="employeeConfirmPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
            </div>
        </div>
    </div>
`;

            Swal.fire({
                title: '',
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Save Employee',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 650,
                backdrop: 'rgba(111, 78, 55, 0.1)',

                didOpen: () => {
                    // Toggle password visibility
                    const toggleIcons = document.querySelectorAll('.toggle-password');
                    toggleIcons.forEach(icon => {
                        icon.addEventListener('click', function () {
                            const targetId = this.getAttribute('data-target');
                            const input = document.getElementById(targetId);
                            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                            input.setAttribute('type', type);
                            this.classList.toggle('fa-eye-slash');
                        });
                    });

                    const emailInput = document.getElementById('employeeEmail');
                    const emailFormatError = document.getElementById('emailFormatError');
                    const emailDuplicateError = document.getElementById('emailDuplicateError');
                    const contactInput = document.getElementById('employeeContact');

                    let emailCheckTimeout;

                    // Real-time email format validation
                    emailInput.addEventListener('input', function () {
                        clearTimeout(emailCheckTimeout);
                        const email = this.value.trim();

                        // Hide all email errors initially
                        emailFormatError.style.display = 'none';
                        emailDuplicateError.style.display = 'none';
                        this.style.borderColor = '';

                        // Check email format
                        if (email && !isValidEmail(email)) {
                            emailFormatError.style.display = 'block';
                            this.style.borderColor = '#dc3545';
                            return;
                        }

                        // If email is valid, check for duplicates
                        if (email && isValidEmail(email)) {
                            emailCheckTimeout = setTimeout(function () {
                                CoffeeShopService.getEmployees().then(function (response) {
                                    if (response.data.Success) {
                                        const existingEmployee = response.data.Employees.find(e =>
                                            e.email && e.email.toLowerCase() === email.toLowerCase()
                                        );
                                        if (existingEmployee) {
                                            emailDuplicateError.style.display = 'block';
                                            emailInput.style.borderColor = '#dc3545';
                                        } else {
                                            emailDuplicateError.style.display = 'none';
                                            emailInput.style.borderColor = '';
                                        }
                                    }
                                });
                            }, 500);
                        }
                    });

                    // Restrict contact input to numbers only
                    contactInput.addEventListener('input', function () {
                        this.value = this.value.replace(/[^0-9]/g, '');
                        if (this.value.length > 11) {
                            this.value = this.value.slice(0, 11);
                        }
                    });

                    // Password validation
                    const password = document.getElementById('employeePassword');
                    const confirmPassword = document.getElementById('employeeConfirmPassword');

                    function validatePasswords() {
                        if (password.value.length > 0 && password.value.length < 6) {
                            password.setCustomValidity('Password must be at least 6 characters');
                        } else {
                            password.setCustomValidity('');
                        }

                        if (password.value !== confirmPassword.value) {
                            confirmPassword.setCustomValidity('Passwords do not match');
                        } else {
                            confirmPassword.setCustomValidity('');
                        }
                    }

                    password.addEventListener('input', validatePasswords);
                    confirmPassword.addEventListener('input', validatePasswords);
                },

                preConfirm: () => {
                    const name = document.getElementById('employeeName').value.trim();
                    const contact = document.getElementById('employeeContact').value.trim();
                    const email = document.getElementById('employeeEmail').value.trim();
                    const password = document.getElementById('employeePassword').value;
                    const confirmPassword = document.getElementById('employeeConfirmPassword').value;

                    // Check for duplicate email error
                    const emailDuplicateError = document.getElementById('emailDuplicateError');
                    if (emailDuplicateError && emailDuplicateError.style.display === 'block') {
                        Swal.showValidationMessage('Please use a different email address. This email is already registered.');
                        return false;
                    }

                    // Check for format email error
                    const emailFormatError = document.getElementById('emailFormatError');
                    if (emailFormatError && emailFormatError.style.display === 'block') {
                        Swal.showValidationMessage('Please enter a valid email address (e.g., name@domain.com)');
                        return false;
                    }

                    // Validate email format using regex
                    if (!isValidEmail(email)) {
                        Swal.showValidationMessage('Please enter a valid email address (e.g., name@domain.com)');
                        return false;
                    }

                    if (!name || !contact || !email || !password || !confirmPassword) {
                        Swal.showValidationMessage('Please fill in all required fields');
                        return false;
                    }

                    if (contact.length !== 11) {
                        Swal.showValidationMessage('Contact number must be 11 digits');
                        return false;
                    }

                    if (password.length < 6) {
                        Swal.showValidationMessage('Password must be at least 6 characters');
                        return false;
                    }

                    if (password !== confirmPassword) {
                        Swal.showValidationMessage('Passwords do not match');
                        return false;
                    }

                    return {
                        Employeename: name,
                        Employeecontact: contact,
                        Employeeemail: email,
                        Employeepassword: password
                    };
                }

            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Show loading state
                    Swal.fire({
                        title: 'Adding Employee...',
                        text: 'Please wait while we save the employee information.',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    CoffeeShopService.addEmployee(result.value).then(function (response) {
                        Swal.close();

                        if (response.data.Success) {
                            const newEmployee = response.data.Employee;
                            if (newEmployee) {
                                employees.push(newEmployee);
                            } else {
                                employees.push({
                                    id: response.data.Id || Date.now(),
                                    name: result.value.Employeename,
                                    contact: result.value.Employeecontact,
                                    email: result.value.Employeeemail
                                });
                            }

                            populateEmployeesTable();

                            Swal.fire({
                                title: 'Success!',
                                text: result.value.Employeename + ' has been added to the system.',
                                icon: 'success',
                                confirmButtonColor: '#A8A54A',
                                timer: 2000,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: response.data.Message,
                                icon: 'error',
                                confirmButtonColor: '#A8A54A'
                            });
                        }
                    }, function (error) {
                        Swal.close();
                        console.error("Error adding employee:", error);
                        Swal.fire({
                            title: 'Connection Error!',
                            text: 'Unable to connect to the server.',
                            icon: 'error',
                            confirmButtonColor: '#A8A54A'
                        });
                    });
                }
            });
        };


        // Load employees with status
        $scope.loadEmployees = function () {
            CoffeeShopService.getEmployees().then(response => {
                if (response.data.Success) {
                    employees.length = 0;
                    response.data.Employees.forEach(emp => {
                        employees.push({
                            id: emp.id,
                            name: emp.name,
                            contact: emp.contact,
                            email: emp.email,
                            isDisabled: emp.isDisabled,
                            isCurrentlyLoggedIn: emp.isCurrentlyLoggedIn,
                            lastLoginDate: emp.lastLoginDate
                        });
                    });
                    $scope.populateEmployeesTable();
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.data.Message,
                        icon: 'error',
                        confirmButtonColor: '#A8A54A'
                    });
                }
            }, error => {
                console.error("Error fetching employees:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'Could not load employees',
                    icon: 'error',
                    confirmButtonColor: '#A8A54A'
                });
            });
        };

        $scope.populateEmployeesTable = function () {
            const tableBody = document.getElementById('employeesTableBody');
            if (!tableBody) return;

            tableBody.innerHTML = '';

            employees.forEach(employee => {
                let statusBadge = '';

                if (employee.isDisabled) {
                    statusBadge = `<span class="status-badge status-inactive" title="Account is disabled/voided">
                            <i class="fas fa-ban"></i> Voided
                           </span>`;
                } else if (employee.isCurrentlyLoggedIn) {
                    statusBadge = `<span class="status-badge status-active" title="Currently logged in">
                            <i class="fas fa-circle" style="font-size: 10px; margin-right: 5px; color: #28a745;"></i>
                            Active
                           </span>`;
                } else {
                    const lastLogin = employee.lastLoginDate ? new Date(employee.lastLoginDate).toLocaleString() : 'Never';
                    statusBadge = `<span class="status-badge" style="background: rgba(108, 117, 125, 0.2); color: #6c757d;" title="Last login: ${lastLogin}">
                            <i class="fas fa-clock"></i> Offline
                           </span>`;
                }

                const row = `
            <tr>
                <td><strong>${escapeHtml(employee.name)}</strong></td>
                <td>${escapeHtml(employee.contact)}</td>
                <td>${escapeHtml(employee.email)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="angular.element(this).scope().editEmployee(${employee.id})">
                            <i class="fas fa-edit" title="Edit Employee"></i>
                        </button>
                        ${!employee.isDisabled ?
                        `<button class="action-btn delete-btn" onclick="angular.element(this).scope().voidEmployee(${employee.id})" title="Void Employee (Disable Account)">
                                <i class="fas fa-ban"></i>
                            </button>
                            <button class="action-btn view-btn" onclick="angular.element(this).scope().deleteEmployeePermanent(${employee.id})" title="Permanently Delete Employee" style="background: rgba(220,53,69,0.15); color: #dc3545;">
                                <i class="fas fa-trash-alt"></i>
                            </button>` :
                        `<button class="action-btn view-btn" onclick="angular.element(this).scope().reactivateEmployee(${employee.id})" title="Reactivate Employee">
                                <i class="fas fa-undo-alt"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="angular.element(this).scope().deleteEmployeePermanent(${employee.id})" title="Permanently Delete Employee">
                                <i class="fas fa-trash-alt"></i>
                            </button>`
                    }
                    </div>
                 </td>
             </tr>
        `;
                tableBody.innerHTML += row;
            });

            $compile(angular.element(tableBody))($scope);
        };

        // Void Employee (soft delete)
        $scope.voidEmployee = function (employeeId) {
            const employee = employees.find(e => e.id === employeeId);
            if (!employee) return;

            Swal.fire({
                title: 'Void Employee?',
                html: `
            <div style="text-align: left;">
                <p><strong>${escapeHtml(employee.name)}</strong> will be marked as <span style="color: #dc3545;">VOIDED/DISABLED</span>.</p>
                <p>The employee's account will be disabled but kept in the database for record-keeping.</p>
                <p>They will no longer be able to log in to the system.</p>
                <p style="color: #dc3545; margin-top: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    This action requires admin authorization.
                </p>
            </div>
        `,
                icon: 'warning',
                input: 'password',
                inputLabel: 'Enter Admin Password',
                inputPlaceholder: 'Enter your admin password...',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: '<i class="fas fa-ban"></i> Void Employee',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                preConfirm: (password) => {
                    if (!password) {
                        Swal.showValidationMessage('Password is required');
                        return false;
                    }

                    Swal.showLoading();

                    return CoffeeShopService.voidEmployee(employeeId, password)
                        .then(response => {
                            if (!response.data.success) {
                                Swal.showValidationMessage(response.data.message || 'Invalid admin password');
                                return false;
                            }
                            return response.data;
                        })
                        .catch(error => {
                            console.error("Void employee error:", error);
                            Swal.showValidationMessage('Server error, please try again');
                            return false;
                        });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Update local data
                    const index = employees.findIndex(e => e.id === employeeId);
                    if (index !== -1) {
                        employees[index].isDisabled = true;
                        employees[index].isCurrentlyLoggedIn = false;
                    }

                    // Refresh the table
                    $scope.populateEmployeesTable();

                    Swal.fire({
                        title: 'Employee Voided!',
                        text: `${employee.name} has been voided successfully.`,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        };

        // Reactivate Employee
        $scope.reactivateEmployee = function (employeeId) {
            const employee = employees.find(e => e.id === employeeId);
            if (!employee) return;

            Swal.fire({
                title: 'Reactivate Employee?',
                html: `
            <div style="text-align: left;">
                <p><strong>${escapeHtml(employee.name)}</strong> will be <span style="color: #28a745;">REACTIVATED</span>.</p>
                <p>The employee will be able to log in to the system again.</p>
                <p style="color: #28a745; margin-top: 10px;">
                    <i class="fas fa-info-circle"></i> 
                    This action requires admin authorization.
                </p>
            </div>
        `,
                icon: 'question',
                input: 'password',
                inputLabel: 'Enter Admin Password',
                inputPlaceholder: 'Enter your admin password...',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: '<i class="fas fa-undo-alt"></i> Reactivate',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                preConfirm: (password) => {
                    if (!password) {
                        Swal.showValidationMessage('Password is required');
                        return false;
                    }

                    Swal.showLoading();

                    return CoffeeShopService.reactivateEmployee(employeeId, password)
                        .then(response => {
                            if (!response.data.success) {
                                Swal.showValidationMessage(response.data.message || 'Invalid admin password');
                                return false;
                            }
                            return response.data;
                        })
                        .catch(error => {
                            console.error("Reactivate employee error:", error);
                            Swal.showValidationMessage('Server error, please try again');
                            return false;
                        });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Update local data
                    const index = employees.findIndex(e => e.id === employeeId);
                    if (index !== -1) {
                        employees[index].isDisabled = false;
                    }

                    // Refresh the table
                    $scope.populateEmployeesTable();

                    Swal.fire({
                        title: 'Employee Reactivated!',
                        text: `${employee.name} has been reactivated successfully.`,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        };

        // Delete Employee (hard delete)
        $scope.deleteEmployeePermanent = function (employeeId) {
            const employee = employees.find(e => e.id === employeeId);
            if (!employee) return;

            Swal.fire({
                title: 'Delete Employee Permanently?',
                html: `
            <div style="text-align: left;">
                <p><strong>${escapeHtml(employee.name)}</strong> will be <span style="color: #dc3545;">PERMANENTLY DELETED</span> from the database.</p>
                <p style="color: #dc3545; margin-top: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>WARNING:</strong> This action cannot be undone!
                </p>
                <p>All employee data will be permanently removed.</p>
                <p style="margin-top: 15px;">This action requires admin authorization.</p>
            </div>
        `,
                icon: 'error',
                input: 'password',
                inputLabel: 'Enter Admin Password',
                inputPlaceholder: 'Enter your admin password...',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: '<i class="fas fa-trash-alt"></i> Permanently Delete',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                preConfirm: (password) => {
                    if (!password) {
                        Swal.showValidationMessage('Password is required');
                        return false;
                    }

                    Swal.showLoading();

                    return CoffeeShopService.deleteEmployeePermanent(employeeId, password)
                        .then(response => {
                            if (!response.data.success) {
                                Swal.showValidationMessage(response.data.message || 'Invalid admin password');
                                return false;
                            }
                            return response.data;
                        })
                        .catch(error => {
                            console.error("Delete employee error:", error);
                            Swal.showValidationMessage('Server error, please try again');
                            return false;
                        });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Remove from local array
                    const index = employees.findIndex(e => e.id === employeeId);
                    if (index !== -1) {
                        employees.splice(index, 1);
                    }

                    // Refresh the table
                    $scope.populateEmployeesTable();

                    Swal.fire({
                        title: 'Employee Deleted!',
                        text: `${employee.name} has been permanently deleted.`,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            });
        };

        // Helper function to escape HTML
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        // Call on page load
        $scope.initEmployees = function () {
            $scope.loadEmployees();
        };
        $scope.initEmployees();



        $scope.editEmployee = function (id) {
            const employee = employees.find(e => e.id === id);
            if (!employee) return;

            const html = `
        <div class="form-header">
            <div class="form-header-icon">
                <i class="fas fa-user-edit"></i>
            </div>
            <div class="form-header-text">
                <div class="form-header-title">Edit Employee</div>
                <div class="form-header-subtitle">Update employee information</div>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="editEmployeeName" class="form-input" value="${employee.name}" required maxlength="50">
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Contact Number *</label>
                <input type="tel" id="editEmployeeContact" class="form-input" value="${employee.contact}" required>
                <span class="form-note">Format: 09XXXXXXXXX (11 digits)</span>
            </div>
            <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input type="email" id="editEmployeeEmail" class="form-input" value="${employee.email}" required maxlength="50">
                <span class="form-note" id="emailError" style="color: #dc3545; display: none; font-size: 12px;"></span>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Password (Leave blank to keep current)</label>
                <div class="password-wrapper">
                    <input type="password" id="editEmployeePassword" class="form-input" placeholder="Enter new password" maxlength="50">
                    <i class="fas fa-eye toggle-password" data-target="editEmployeePassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
                </div>
                <span class="form-note">Password must be at least 6 characters</span>
            </div>
            <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" id="editEmployeeConfirmPassword" class="form-input" placeholder="Confirm new password" maxlength="50">
                    <i class="fas fa-eye toggle-password" data-target="editEmployeeConfirmPassword" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer;"></i>
                </div>
            </div>
        </div>
    `;

            Swal.fire({
                title: '',
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 650,
                backdrop: 'rgba(111, 78, 55, 0.1)',

                didOpen: () => {
                    // Toggle password visibility
                    const toggleIcons = document.querySelectorAll('.toggle-password');
                    toggleIcons.forEach(icon => {
                        icon.addEventListener('click', function () {
                            const targetId = this.getAttribute('data-target');
                            const input = document.getElementById(targetId);
                            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                            input.setAttribute('type', type);
                            this.classList.toggle('fa-eye-slash');
                        });
                    });

                    const emailInput = document.getElementById('editEmployeeEmail');
                    const emailError = document.getElementById('emailError');
                    const originalEmail = employee.email;
                    const contactInput = document.getElementById('editEmployeeContact');
                    const password = document.getElementById('editEmployeePassword');
                    const confirmPassword = document.getElementById('editEmployeeConfirmPassword');

                    let emailCheckTimeout;

                    // Real-time email validation
                    emailInput.addEventListener('input', function () {
                        clearTimeout(emailCheckTimeout);
                        const email = this.value.trim();
                        emailError.style.display = 'none';
                        this.style.borderColor = '';

                        if (email === originalEmail) {
                            this.style.borderColor = '';
                            return;
                        }

                        if (email && email.includes('@') && email.includes('.')) {
                            emailCheckTimeout = setTimeout(function () {
                                const existingEmployee = employees.find(e =>
                                    e.id !== id && e.email.toLowerCase() === email.toLowerCase()
                                );
                                if (existingEmployee) {
                                    emailError.textContent = 'This email is already registered to another employee. Please use a different email.';
                                    emailError.style.display = 'block';
                                    emailInput.style.borderColor = '#dc3545';
                                } else {
                                    emailError.style.display = 'none';
                                    emailInput.style.borderColor = '#28a745';
                                }
                            }, 500);
                        }
                    });

                    // Restrict contact input to numbers only
                    contactInput.addEventListener('input', function () {
                        this.value = this.value.replace(/[^0-9]/g, '');
                        if (this.value.length > 11) {
                            this.value = this.value.slice(0, 11);
                        }
                    });

                    // Password validation
                    function validatePasswords() {
                        if (password.value.length > 0 && password.value.length < 6) {
                            password.setCustomValidity('Password must be at least 6 characters');
                        } else {
                            password.setCustomValidity('');
                        }

                        if (password.value !== confirmPassword.value) {
                            confirmPassword.setCustomValidity('Passwords do not match');
                        } else {
                            confirmPassword.setCustomValidity('');
                        }
                    }

                    password.addEventListener('input', validatePasswords);
                    confirmPassword.addEventListener('input', validatePasswords);
                },

                preConfirm: () => {
                    const name = document.getElementById('editEmployeeName').value.trim();
                    const contact = document.getElementById('editEmployeeContact').value.trim();
                    const email = document.getElementById('editEmployeeEmail').value.trim();
                    const password = document.getElementById('editEmployeePassword').value;
                    const confirmPassword = document.getElementById('editEmployeeConfirmPassword').value;

                    const emailError = document.getElementById('emailError');
                    if (emailError && emailError.style.display === 'block') {
                        Swal.showValidationMessage('Please use a different email address. This email is already registered.');
                        return false;
                    }

                    if (!name || !contact || !email) {
                        Swal.showValidationMessage('Please fill in all required fields');
                        return false;
                    }

                    if (contact.length !== 11) {
                        Swal.showValidationMessage('Contact number must be 11 digits');
                        return false;
                    }

                    if (password) {
                        if (password.length > 0 && password.length < 6) {
                            Swal.showValidationMessage('Password must be at least 6 characters');
                            return false;
                        }

                        if (password !== confirmPassword) {
                            Swal.showValidationMessage('Passwords do not match');
                            return false;
                        }
                    }

                    return {
                        EmployeeID: id,
                        Employeename: name,
                        Employeecontact: contact,
                        Employeeemail: email,
                        Employeepassword: password || ''
                    };
                }

            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    Swal.fire({
                        title: 'Updating Employee...',
                        text: 'Please wait while we update the employee information.',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    CoffeeShopService.updateEmployee(result.value).then(function (response) {
                        Swal.close();

                        if (response.data.Success) {
                            const index = employees.findIndex(e => e.id === id);
                            if (index !== -1) {
                                employees[index] = {
                                    id: id,
                                    name: result.value.Employeename,
                                    contact: result.value.Employeecontact,
                                    email: result.value.Employeeemail
                                };
                            }

                            populateEmployeesTable();

                            Swal.fire({
                                title: 'Updated!',
                                text: `${result.value.Employeename}'s information has been updated.`,
                                icon: 'success',
                                confirmButtonColor: '#A8A54A',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: response.data.Message,
                                icon: 'error',
                                confirmButtonColor: '#A8A54A'
                            });
                        }
                    }, function (error) {
                        Swal.close();
                        console.error("Error updating employee:", error);
                        Swal.fire({
                            title: 'Connection Error!',
                            text: 'Unable to connect to the server.',
                            icon: 'error',
                            confirmButtonColor: '#A8A54A'
                        });
                    });
                }
            });
        };

        // Load Activity Logs
        $scope.loadActivityLogs = function () {
            CoffeeShopService.getActivityLogs().then(function (response) {
                if (response.data.success) {
                    $scope.activityLogs = response.data.data;
                    $scope.populateActivityLogsTable();
                } else {
                    console.error("Error loading logs:", response.data.message);
                    Swal.fire({
                        title: 'Error',
                        text: 'Could not load activity logs: ' + response.data.message,
                        icon: 'error',
                        confirmButtonColor: '#A8A54A'
                    });
                }
            }).catch(function (error) {
                console.error("Error fetching logs:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'Could not connect to the server',
                    icon: 'error',
                    confirmButtonColor: '#A8A54A'
                });
            });
        };

        // Populate Activity Logs Table
        $scope.populateActivityLogsTable = function () {
            const tableBody = document.getElementById('logsTableBody');
            if (!tableBody) return;

            tableBody.innerHTML = '';

            if (!$scope.activityLogs || $scope.activityLogs.length === 0) {
                tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 50px;">
                    <i class="fas fa-clipboard-list" style="font-size: 40px; color: var(--color-light); margin-bottom: 15px; display: block;"></i>
                    <p style="color: var(--color-text); opacity: 0.7;">No activity logs available.</p>
                <\/td>
            <\/tr>
        `;
                return;
            }

            $scope.activityLogs.forEach(log => {
                // Format the date and time - FIX THIS PART ONLY
                let formattedDateTime = '';

                if (log.DateCreated) {
                    try {
                        // Extract timestamp from JSON date format: /Date(1774713600000)/
                        let timestamp;
                        if (typeof log.DateCreated === 'string' && log.DateCreated.indexOf('/Date(') === 0) {
                            const match = log.DateCreated.match(/\/Date\((\d+)\)\//);
                            if (match && match[1]) {
                                timestamp = parseInt(match[1]);
                            }
                        } else if (typeof log.DateCreated === 'string') {
                            timestamp = Date.parse(log.DateCreated);
                        } else if (typeof log.DateCreated === 'number') {
                            timestamp = log.DateCreated;
                        } else if (log.DateCreated instanceof Date) {
                            timestamp = log.DateCreated.getTime();
                        }

                        if (timestamp && !isNaN(timestamp)) {
                            const dateObj = new Date(timestamp);

                            // Format date as MM/DD/YYYY
                            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                            const day = dateObj.getDate().toString().padStart(2, '0');
                            const year = dateObj.getFullYear();

                            // Format time
                            let timeStr = '';
                            if (log.LogTime) {
                                if (typeof log.LogTime === 'string') {
                                    timeStr = log.LogTime;
                                } else if (log.LogTime.Hours !== undefined) {
                                    const hours = log.LogTime.Hours.toString().padStart(2, '0');
                                    const minutes = log.LogTime.Minutes.toString().padStart(2, '0');
                                    const seconds = log.LogTime.Seconds.toString().padStart(2, '0');
                                    timeStr = `${hours}:${minutes}:${seconds}`;
                                } else {
                                    const hours = dateObj.getHours().toString().padStart(2, '0');
                                    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                                    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
                                    timeStr = `${hours}:${minutes}:${seconds}`;
                                }
                            } else {
                                const hours = dateObj.getHours().toString().padStart(2, '0');
                                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                                const seconds = dateObj.getSeconds().toString().padStart(2, '0');
                                timeStr = `${hours}:${minutes}:${seconds}`;
                            }

                            formattedDateTime = `${month}/${day}/${year} ${timeStr}`;
                        } else {
                            formattedDateTime = 'Invalid Date';
                        }
                    } catch (e) {
                        console.error("Date parsing error:", e);
                        formattedDateTime = 'Invalid Date';
                    }
                } else {
                    formattedDateTime = 'N/A';
                }

                // Get user name - FIX THIS PART ONLY
                let userName = 'System';
                if (log.AdminName) {
                    userName = log.AdminName;
                } else if (log.EmployeeName) {
                    userName = log.EmployeeName;
                }

                // Module badge styling (KEEP AS IS - WORKING)
                let moduleBadgeClass = '';
                let moduleIcon = '';
                switch (log.Module) {
                    case 'Authentication':
                        moduleBadgeClass = 'status-active';
                        moduleIcon = '<i class="fas fa-key" style="margin-right: 5px;"></i>';
                        break;
                    case 'Orders':
                        moduleBadgeClass = 'status-badge';
                        moduleIcon = '<i class="fas fa-shopping-cart" style="margin-right: 5px;"></i>';
                        break;
                    case 'Products':
                        moduleBadgeClass = 'status-badge';
                        moduleIcon = '<i class="fas fa-coffee" style="margin-right: 5px;"></i>';
                        break;
                    case 'Employees':
                        moduleBadgeClass = 'status-badge';
                        moduleIcon = '<i class="fas fa-users" style="margin-right: 5px;"></i>';
                        break;
                    case 'Security':
                        moduleBadgeClass = 'status-warning';
                        moduleIcon = '<i class="fas fa-shield-alt" style="margin-right: 5px;"></i>';
                        break;
                    case 'Inventory':
                        moduleBadgeClass = 'status-badge';
                        moduleIcon = '<i class="fas fa-boxes" style="margin-right: 5px;"></i>';
                        break;
                    default:
                        moduleBadgeClass = 'status-badge';
                        moduleIcon = '<i class="fas fa-tag" style="margin-right: 5px;"></i>';
                }

                // Action badge styling (KEEP AS IS - WORKING)
                let actionClass = '';
                let actionIcon = '';
                const actionLower = (log.Action || '').toLowerCase();
                if (actionLower.includes('login')) {
                    actionClass = 'status-active';
                    actionIcon = '<i class="fas fa-sign-in-alt" style="margin-right: 5px;"></i>';
                } else if (actionLower.includes('logout')) {
                    actionClass = 'status-inactive';
                    actionIcon = '<i class="fas fa-sign-out-alt" style="margin-right: 5px;"></i>';
                } else if (actionLower.includes('delete') || actionLower.includes('void')) {
                    actionClass = 'status-out';
                    actionIcon = '<i class="fas fa-trash-alt" style="margin-right: 5px;"></i>';
                } else if (actionLower.includes('reset') || actionLower.includes('update')) {
                    actionClass = 'status-low';
                    actionIcon = '<i class="fas fa-edit" style="margin-right: 5px;"></i>';
                } else if (actionLower.includes('add') || actionLower.includes('create')) {
                    actionClass = 'status-active';
                    actionIcon = '<i class="fas fa-plus-circle" style="margin-right: 5px;"></i>';
                } else {
                    actionClass = 'status-badge';
                    actionIcon = '<i class="fas fa-info-circle" style="margin-right: 5px;"></i>';
                }

                // Role badge styling (KEEP AS IS - WORKING)
                let roleClass = '';
                let roleIcon = '';
                if (log.Role === 'Admin') {
                    roleClass = 'status-active';
                    roleIcon = '<i class="fas fa-user-shield" style="margin-right: 5px;"></i>';
                } else if (log.Role === 'Employee') {
                    roleClass = 'status-badge';
                    roleIcon = '<i class="fas fa-user" style="margin-right: 5px;"></i>';
                } else {
                    roleClass = 'status-inactive';
                    roleIcon = '<i class="fas fa-robot" style="margin-right: 5px;"></i>';
                }

                const row = `
            <tr>
                <td style="white-space: nowrap;">${escapeHtml(formattedDateTime)}<\/td>
                <td><strong>${escapeHtml(userName)}<\/strong><\/td>
                <td><span class="${roleClass}" style="padding: 4px 12px; border-radius: 20px;">${roleIcon} ${escapeHtml(log.Role)}<\/span><\/td>
                <td><span class="${moduleBadgeClass}" style="background: rgba(23, 162, 184, 0.15); color: #17a2b8; padding: 4px 12px; border-radius: 20px;">${moduleIcon} ${escapeHtml(log.Module)}<\/span><\/td>
                <td><span class="${actionClass}" style="padding: 4px 12px; border-radius: 20px;">${actionIcon} ${escapeHtml(log.Action)}<\/span><\/td>
                <td style="max-width: 400px;">${escapeHtml(log.Description)}<\/td>
            <\/tr>
        `;
                tableBody.innerHTML += row;
            });

            // Update log count
            const logCount = document.getElementById('logCount');
            if (logCount) {
                logCount.innerHTML = `Showing ${$scope.activityLogs.length} logs`;
            }

            // Recompile for AngularJS bindings
            $compile(angular.element(tableBody))($scope);
        };

        // Helper function to escape HTML
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        // Add these functions to your AngularJS controller

        // Search logs
        $scope.searchLogs = function () {
            const searchTerm = document.getElementById('logsSearch').value.toLowerCase();
            const rows = document.querySelectorAll('#logsTableBody tr');

            rows.forEach(row => {
                if (row.cells && row.cells.length > 0) {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                }
            });

            // Update visible count
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
            const logCount = document.getElementById('logCount');
            if (logCount) {
                logCount.innerHTML = `Showing ${visibleRows.length} of ${$scope.activityLogs.length} logs`;
            }
        };

        // Filter logs by module
        $scope.filterLogsByModule = function (module) {
            const rows = document.querySelectorAll('#logsTableBody tr');

            if (!module || module === 'all') {
                rows.forEach(row => {
                    row.style.display = '';
                });
                // Re-apply search if there's a search term
                const searchTerm = document.getElementById('logsSearch').value;
                if (searchTerm) {
                    $scope.searchLogs();
                }
                return;
            }

            rows.forEach(row => {
                if (row.cells && row.cells.length > 0) {
                    const moduleCell = row.cells[3];
                    if (moduleCell) {
                        const rowModule = moduleCell.textContent.trim();
                        row.style.display = rowModule === module ? '' : 'none';
                    }
                }
            });

            // Update visible count
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
            const logCount = document.getElementById('logCount');
            if (logCount) {
                logCount.innerHTML = `Showing ${visibleRows.length} of ${$scope.activityLogs.length} logs`;
            }
        };

        // Filter logs by action type
        $scope.filterLogsByAction = function (actionType) {
            const rows = document.querySelectorAll('#logsTableBody tr');

            if (!actionType || actionType === 'all') {
                rows.forEach(row => {
                    row.style.display = '';
                });
                // Re-apply search if there's a search term
                const searchTerm = document.getElementById('logsSearch').value;
                if (searchTerm) {
                    $scope.searchLogs();
                }
                return;
            }

            rows.forEach(row => {
                if (row.cells && row.cells.length > 0) {
                    const actionCell = row.cells[4];
                    if (actionCell) {
                        const rowAction = actionCell.textContent.trim().toLowerCase();
                        let match = false;

                        switch (actionType) {
                            case 'login':
                                match = rowAction.includes('login') || rowAction.includes('logged in');
                                break;
                            case 'logout':
                                match = rowAction.includes('logout') || rowAction.includes('logged out');
                                break;
                            case 'order':
                                match = rowAction.includes('order');
                                break;
                            case 'employee':
                                match = rowAction.includes('employee');
                                break;
                            case 'product':
                                match = rowAction.includes('product');
                                break;
                            case 'security':
                                match = rowAction.includes('password') || rowAction.includes('reset');
                                break;
                            default:
                                match = true;
                        }

                        row.style.display = match ? '' : 'none';
                    }
                }
            });

            // Update visible count
            const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
            const logCount = document.getElementById('logCount');
            if (logCount) {
                logCount.innerHTML = `Showing ${visibleRows.length} of ${$scope.activityLogs.length} logs`;
            }
        };

        // Refresh logs
        $scope.refreshLogs = function () {
            Swal.fire({
                title: 'Refreshing...',
                text: 'Loading latest activity logs',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            $scope.loadActivityLogs();

            setTimeout(() => {
                Swal.close();
                Swal.fire({
                    title: 'Updated!',
                    text: 'Activity logs have been refreshed.',
                    icon: 'success',
                    confirmButtonColor: '#A8A54A',
                    timer: 1500,
                    showConfirmButton: false
                });
            }, 500);
        };

        // Export logs to CSV
        $scope.exportLogsToCSV = function () {
            if (!$scope.activityLogs || $scope.activityLogs.length === 0) {
                Swal.fire({
                    title: 'No Data',
                    text: 'There are no logs to export.',
                    icon: 'info',
                    confirmButtonColor: '#A8A54A'
                });
                return;
            }

            // Prepare CSV headers
            let csv = 'Date & Time,User,Role,Module,Action,Description\n';

            // Add data rows
            $scope.activityLogs.forEach(log => {
                let dateTimeStr = '';
                if (log.DateCreated) {
                    const timestamp = parseInt(log.DateCreated.replace(/\/Date\((\d+)\)\//, '$1'), 10);
                    const jsDate = new Date(timestamp);
                    dateTimeStr = `${jsDate.toLocaleDateString()} ${jsDate.toLocaleTimeString()}`;
                }

                const employeeName = log.EmployeeName || (log.AdminName ? `${log.AdminName} (Admin)` : 'System');

                csv += `"${dateTimeStr}","${employeeName}","${log.Role}","${log.Module}","${log.Action}","${log.Description.replace(/"/g, '""')}"\n`;
            });

            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 19)}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Swal.fire({
                title: 'Exported!',
                text: 'Activity logs have been exported to CSV.',
                icon: 'success',
                confirmButtonColor: '#A8A54A',
                timer: 1500,
                showConfirmButton: false
            });
        };

        //Product functions

        $scope.showAddProductModal = function () {

            const categories = [
                "coffee", "non-coffee", "frappes", "pastas",
                "sandwiches", "nachos", "croffles", "pastry"
            ];

            const categoryDisplayNames = {
                "coffee": "Coffee",
                "non-coffee": "Non-Coffee",
                "frappes": "Frappes",
                "pastas": "Pastas",
                "sandwiches": "Sandwiches",
                "nachos": "Nachos",
                "croffles": "Croffles",
                "pastry": "Pastry"
            };

            let categoryButtons = categories.map(cat =>
                `<button type="button" class="category-btn" data-value="${cat}">
        ${categoryDisplayNames[cat]}
    </button>`
            ).join('');

            let addonsSection = `
    <div class="addons-section">
        <div class="addons-section-header">
            <div class="addons-section-title">Custom Add-ons (Optional)</div>
            <button type="button" class="add-addon-btn" id="addAddonBtn">
                <i class="fas fa-plus"></i> Add New Add-on
            </button>
        </div>
        <div class="addons-container" id="addonsContainer">
            <div class="no-addons-message" id="noAddonsMessage">
                No add-ons added yet.
            </div>
        </div>
    </div>
`;

            const html = `
    <div class="form-group">
        <label>Product Name *</label>
        <input type="text" id="productName" class="form-input" required maxlength="50">
        <span class="form-note" id="productNameError" style="color: #dc3545; display: none; font-size: 12px; margin-top: 5px;"></span>
    </div>
 
    <div class="form-group">
        <label>Category *</label>
        <div class="category-options">
            ${categoryButtons}
        </div>
        <input type="hidden" id="selectedCategory">
    </div>
 
    <div class="form-row">
        <div class="form-group">
            <label>Price *</label>
            <input type="number" id="productPrice" min="0" step="0.01" required>
        </div>
        <div class="form-group">
            <label>Initial Stock *</label>
            <input type="number" id="productStock" min="0" required>
        </div>
    </div>
 
    <div class="form-group">
        <label>Product Image</label>
        <div class="image-upload-container" id="imageUploadContainer">
            <img id="imagePreview" class="image-preview" src="" alt="Product Preview">
            <button type="button" class="upload-btn" id="uploadTrigger">
                <i class="fas fa-upload"></i> Choose Image
            </button>
            <input type="file" id="productImage" class="upload-input" accept="image/*">
        </div>
        <input type="hidden" id="selectedImageUrl">
    </div>
 
    ${addonsSection}
`;

            Swal.fire({
                title: 'Add New Product',
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Save Product',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 700,
                backdrop: 'rgba(111, 78, 55, 0.1)',

                didOpen: () => {
                    // Product name validation with duplicate check
                    const productNameInput = document.getElementById('productName');
                    const productNameError = document.getElementById('productNameError');
                    let nameCheckTimeout;

                    productNameInput.addEventListener('input', function () {
                        clearTimeout(nameCheckTimeout);
                        const productName = this.value.trim();
                        productNameError.style.display = 'none';
                        this.style.borderColor = '';

                        if (productName && productName.length >= 3) {
                            nameCheckTimeout = setTimeout(function () {
                                // Check if product name already exists by fetching all products
                                CoffeeShopService.getProducts().then(function (response) {
                                    if (response.data.Success) {
                                        const existingProduct = response.data.Products.find(p =>
                                            p.name.toLowerCase() === productName.toLowerCase()
                                        );
                                        if (existingProduct) {
                                            productNameError.textContent = 'This product name is already taken. Please use a different name.';
                                            productNameError.style.display = 'block';
                                            productNameInput.style.borderColor = '#dc3545';
                                        } else {
                                            productNameError.style.display = 'none';
                                            productNameInput.style.borderColor = '';
                                        }
                                    }
                                });
                            }, 500);
                        } else if (productName && productName.length < 3) {
                            productNameError.textContent = 'Product name must be at least 3 characters';
                            productNameError.style.display = 'block';
                            productNameInput.style.borderColor = '#dc3545';
                        }
                    });

                    // Category selection
                    const categoryBtns = document.querySelectorAll('.category-btn');
                    const hiddenInput = document.getElementById('selectedCategory');
                    categoryBtns.forEach(btn => {
                        btn.addEventListener('click', function () {
                            categoryBtns.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                            hiddenInput.value = this.getAttribute('data-value');
                        });
                    });

                    // Add-ons
                    const addonsContainer = document.getElementById('addonsContainer');
                    const noAddonsMessage = document.getElementById('noAddonsMessage');

                    function createAddonItem(name = '', price = '') {
                        const addonItem = document.createElement('div');
                        addonItem.className = 'addon-item';
                        addonItem.innerHTML = `
                <input type="text" placeholder="Add-on name" value="${name}" data-addon-name maxlength="50">
                <input type="number" placeholder="0.00" min="0" step="0.01" value="${price}" data-addon-price>
                <button type="button" data-remove-addon>X</button>
            `;
                        addonItem.querySelector('[data-remove-addon]')
                            .addEventListener('click', () => {
                                addonItem.remove();
                                updateNoAddonsMessage();
                            });
                        return addonItem;
                    }

                    function updateNoAddonsMessage() {
                        const items = addonsContainer.querySelectorAll('.addon-item');
                        noAddonsMessage.style.display = items.length === 0 ? 'block' : 'none';
                    }

                    document.getElementById('addAddonBtn')
                        .addEventListener('click', () => {
                            addonsContainer.appendChild(createAddonItem());
                            updateNoAddonsMessage();
                        });

                    updateNoAddonsMessage();

                    // Image upload
                    const uploadTrigger = document.getElementById('uploadTrigger');
                    const productImage = document.getElementById('productImage');
                    const imagePreview = document.getElementById('imagePreview');
                    const selectedImageUrl = document.getElementById('selectedImageUrl');

                    uploadTrigger.addEventListener('click', () => productImage.click());

                    productImage.addEventListener('change', function () {
                        const file = this.files[0];
                        if (!file) return;

                        uploadTrigger.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;
                        uploadTrigger.disabled = true;

                        CoffeeShopService.uploadFile(file).then(response => {
                            if (response.data.Success) {
                                const uploadedPath = response.data.FilePath;
                                selectedImageUrl.value = uploadedPath;
                                imagePreview.src = uploadedPath;
                                imagePreview.classList.add('visible');
                            } else {
                                Swal.fire({
                                    title: 'Upload Failed',
                                    text: response.data.Message,
                                    icon: 'error',
                                    confirmButtonColor: '#A8A54A'
                                });
                            }
                        }).catch(error => {
                            console.error("Upload error:", error);
                            Swal.fire({
                                title: 'Upload Error',
                                text: 'Server error during upload',
                                icon: 'error',
                                confirmButtonColor: '#A8A54A'
                            });
                        }).finally(() => {
                            uploadTrigger.innerHTML = `<i class="fas fa-upload"></i> Choose Image`;
                            uploadTrigger.disabled = false;
                        });
                    });
                },

                preConfirm: () => {
                    const name = document.getElementById('productName').value.trim();
                    const category = document.getElementById('selectedCategory').value;
                    const price = parseFloat(document.getElementById('productPrice').value);
                    const stock = parseInt(document.getElementById('productStock').value);
                    const imageUrl = document.getElementById('selectedImageUrl').value;

                    // Check for duplicate name error
                    const productNameError = document.getElementById('productNameError');
                    if (productNameError && productNameError.style.display === 'block') {
                        Swal.showValidationMessage('Please use a different product name. This name is already taken.');
                        return false;
                    }

                    if (!name || !category || !price || !stock) {
                        Swal.showValidationMessage('Please fill in all required fields');
                        return false;
                    }

                    if (name.length < 3) {
                        Swal.showValidationMessage('Product name must be at least 3 characters');
                        return false;
                    }

                    if (!imageUrl) {
                        Swal.showValidationMessage('Please upload a product image');
                        return false;
                    }

                    if (price <= 0) {
                        Swal.showValidationMessage('Price must be greater than 0');
                        return false;
                    }

                    const addonItems = document.querySelectorAll('.addon-item');
                    const customAddons = [];

                    addonItems.forEach(item => {
                        const nameInput = item.querySelector('[data-addon-name]');
                        const priceInput = item.querySelector('[data-addon-price]');
                        if (nameInput && nameInput.value.trim()) {
                            const parsedPrice = parseFloat(priceInput.value);
                            customAddons.push({
                                addonName: nameInput.value.trim(),
                                addonPrice: isNaN(parsedPrice) ? 0 : parsedPrice
                            });
                        }
                    });

                    return {
                        Productname: name,
                        Productprice: price,
                        CategoryName: category,
                        Productpicpath: imageUrl,
                        Productpicfilename: imageUrl.split('/').pop(),
                        InitialStock: stock,
                        customAddons: customAddons
                    };
                }

            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Show loading state
                    Swal.fire({
                        title: 'Adding Product...',
                        text: 'Please wait while we save the product information.',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    CoffeeShopService.addProduct(result.value).then(response => {
                        Swal.close();

                        if (response.data.Success) {
                            // Refresh the inventory
                            $scope.loadInventory();

                            Swal.fire({
                                title: 'Success!',
                                text: response.data.Message,
                                icon: 'success',
                                confirmButtonColor: '#A8A54A',
                                timer: 2500,
                                showConfirmButton: false
                            });
                        } else {
                            // Handle duplicate product name error
                            let errorMessage = response.data.Message;
                            if (errorMessage.toLowerCase().includes('name already exists')) {
                                Swal.fire({
                                    title: 'Duplicate Product Name!',
                                    html: `
                            <div style="text-align: left;">
                                <p><strong>${errorMessage}</strong></p>
                                <p style="margin-top: 10px; color: #666;">Please try again with a different product name.</p>
                            </div>
                        `,
                                    icon: 'error',
                                    confirmButtonColor: '#A8A54A',
                                    confirmButtonText: 'Try Again'
                                });
                            } else {
                                Swal.fire({
                                    title: 'Error',
                                    text: errorMessage,
                                    icon: 'error',
                                    confirmButtonColor: '#A8A54A'
                                });
                            }
                        }
                    }, error => {
                        Swal.close();
                        console.error("Error adding product:", error);
                        Swal.fire({
                            title: 'Connection Error!',
                            text: 'Unable to connect to the server. Please check your internet connection and try again.',
                            icon: 'error',
                            confirmButtonColor: '#A8A54A'
                        });
                    });
                }
            });
        };
        $scope.populateInventoryTable = function () {
            const tableBody = document.getElementById('inventoryTableBody');
            tableBody.innerHTML = '';

            products.forEach(product => {
                let statusBadge = product.status === 'active'
                    ? `<span class="status-badge status-active">In Stock</span>`
                    : `<span class="status-badge status-out">Out of Stock</span>`;

                let addonsDisplay = 'No add-ons';
                if (product.addons && product.addons.length > 0) {
                    addonsDisplay = product.addons.map(addon =>
                        `<div style="margin-bottom: 4px;">
                                 <span style="color: var(--color-accent); font-weight: 600;">${addon.name}</span>
                                 <span style="color: var(--color-primary); font-weight: 600;"> (+₱${addon.price})</span>
                             </div>`
                    ).join('');
                }

                const row = `
                        <tr>
                            <td>
                                <div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden;">
                                    <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            </td>
                            <td><strong>${product.name}</strong></td>
                            <td><span class="status-badge" style="background: rgba(168, 165, 74, 0.1); color: var(--color-accent);">${product.category}</span></td>
                            <td>₱${product.price}.00</td>
                            <td>${product.stock} units</td>
                            <td>${addonsDisplay}</td>
                            <td>
                                <div style="max-width: 200px;">
                                    ${statusBadge}
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                <button class="action-btn edit-btn" onclick="angular.element(this).scope().editProduct(${product.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                <button class="action-btn delete-btn" onclick="angular.element(this).scope().deleteProduct(${product.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                tableBody.innerHTML += row;
            });
        }


        // Load products from server
        $scope.loadInventory = function () {
            CoffeeShopService.getProducts().then(response => {
                if (response.data.Success) {
                    products.length = 0; // clear existing array
                    response.data.Products.forEach(p => products.push(p));
                    populateInventoryTable();
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.data.Message,
                        icon: 'error',
                        confirmButtonColor: '#A8A54A'
                    });
                }
            }, error => {
                console.error("Error fetching products:", error);
                Swal.fire({
                    title: 'Error',
                    text: 'Could not load inventory',
                    icon: 'error',
                    confirmButtonColor: '#A8A54A'
                });
            });
        };
        
        $scope.init = function () {
            $scope.getUserSession();
            $scope.loadInventory();
            $scope.loadEmployees(); // Add this line
            $scope.loadActivityLogs(); // Add this line
            $scope.getOrderHistory('AdminOrderHistoryTable');
        };

        // Call init when controller loads
        $scope.init();


        $scope.editProduct = function (id) {

            const product = products.find(p => p.id === id);
            if (!product) return;

            const categories = [
                "coffee", "non-coffee", "frappes", "pastas",
                "sandwiches", "nachos", "croffles", "pastry"
            ];

            const categoryDisplayNames = {
                "coffee": "Coffee",
                "non-coffee": "Non-Coffee",
                "frappes": "Frappes",
                "pastas": "Pastas",
                "sandwiches": "Sandwiches",
                "nachos": "Nachos",
                "croffles": "Croffles",
                "pastry": "Pastry"
            };

            let categoryButtons = categories.map(cat =>
                `<button type="button" class="category-btn ${product.category === cat ? 'selected' : ''}" data-value="${cat}">
            ${categoryDisplayNames[cat]}
        </button>`
            ).join('');

            let addonsSection = `
        <div class="addons-section">
            <div class="addons-section-header">
                <div class="addons-section-title">Custom Add-ons</div>
                <button type="button" class="add-addon-btn" id="addAddonBtn">
                    <i class="fas fa-plus"></i> Add New Add-on
                </button>
            </div>
            <div class="addons-container" id="addonsContainer">
                ${product.addons && product.addons.length > 0 ? '' : `
                    <div class="no-addons-message" id="noAddonsMessage">
                        No add-ons added yet.
                    </div>
                `}
            </div>
        </div>
    `;

            const html = `
        <div class="form-group">
            <label>Product Image</label>
            <div class="image-upload-container">
                <img id="imagePreview" class="image-preview visible" src="${product.image}">
                <button type="button" class="upload-btn" id="uploadTrigger">
                    <i class="fas fa-upload"></i> Change Image
                </button>
                <input type="file" id="productImage" class="upload-input" accept="image/*">
            </div>
            <input type="hidden" id="selectedImageUrl" value="${product.image}">
        </div>
 
        <div class="form-group">
            <label>Product Name *</label>
            <input type="text" id="editProductName" class="form-input" value="${product.name}" required maxlength="50">
            <span class="form-note" id="productNameError" style="color: #dc3545; display: none; font-size: 12px; margin-top: 5px;"></span>
        </div>
 
        <div class="form-group">
            <label>Category *</label>
            <div class="category-options">
                ${categoryButtons}
            </div>
            <input type="hidden" id="selectedCategory" value="${product.category}">
        </div>
 
        <div class="form-row">
            <div class="form-group">
                <label>Price *</label>
                <input type="number" id="editProductPrice" class="form-input" value="${product.price}" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Stock *</label>
                <input type="number" id="editProductStock" class="form-input" value="${product.stock}" min="0" required>
            </div>
        </div>
 
        ${addonsSection}
    `;

            Swal.fire({
                title: 'Edit Product',
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#A8A54A',
                cancelButtonColor: '#6F4E37',
                width: 700,
                backdrop: 'rgba(111, 78, 55, 0.1)',

                didOpen: () => {
                    // Product name validation with duplicate check
                    const productNameInput = document.getElementById('editProductName');
                    const productNameError = document.getElementById('productNameError');
                    const originalName = product.name;
                    let nameCheckTimeout;

                    productNameInput.addEventListener('input', function () {
                        clearTimeout(nameCheckTimeout);
                        const productName = this.value.trim();
                        productNameError.style.display = 'none';
                        this.style.borderColor = '';

                        // Skip check if name hasn't changed
                        if (productName === originalName) {
                            this.style.borderColor = '';
                            return;
                        }

                        if (productName && productName.length >= 3) {
                            nameCheckTimeout = setTimeout(function () {
                                // Check if product name already exists by fetching all products
                                CoffeeShopService.getProducts().then(function (response) {
                                    if (response.data.Success) {
                                        const existingProduct = response.data.Products.find(p =>
                                            p.id !== id && p.name.toLowerCase() === productName.toLowerCase()
                                        );
                                        if (existingProduct) {
                                            productNameError.textContent = 'This product name is already taken. Please use a different name.';
                                            productNameError.style.display = 'block';
                                            productNameInput.style.borderColor = '#dc3545';
                                        } else {
                                            productNameError.style.display = 'none';
                                            productNameInput.style.borderColor = '';
                                        }
                                    }
                                });
                            }, 500);
                        } else if (productName && productName.length < 3) {
                            productNameError.textContent = 'Product name must be at least 3 characters';
                            productNameError.style.display = 'block';
                            productNameInput.style.borderColor = '#dc3545';
                        }
                    });

                    // Category selection
                    const categoryBtns = document.querySelectorAll('.category-btn');
                    const hiddenInput = document.getElementById('selectedCategory');
                    categoryBtns.forEach(btn => {
                        btn.addEventListener('click', function () {
                            categoryBtns.forEach(b => b.classList.remove('selected'));
                            this.classList.add('selected');
                            hiddenInput.value = this.getAttribute('data-value');
                        });
                    });

                    // Image upload
                    const uploadTrigger = document.getElementById('uploadTrigger');
                    const productImage = document.getElementById('productImage');
                    const imagePreview = document.getElementById('imagePreview');
                    const selectedImageUrl = document.getElementById('selectedImageUrl');

                    uploadTrigger.addEventListener('click', () => productImage.click());
                    productImage.addEventListener('change', function () {
                        const file = this.files[0];
                        if (!file) return;
                        uploadTrigger.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;
                        uploadTrigger.disabled = true;

                        CoffeeShopService.uploadFile(file).then(response => {
                            if (response.data.Success) {
                                const uploadedPath = response.data.FilePath;
                                selectedImageUrl.value = uploadedPath;
                                imagePreview.src = uploadedPath;
                            } else {
                                Swal.fire('Upload Failed', response.data.Message, 'error');
                            }
                        }).catch(() => {
                            Swal.fire('Error', 'Upload failed', 'error');
                        }).finally(() => {
                            uploadTrigger.innerHTML = `<i class="fas fa-upload"></i> Change Image`;
                            uploadTrigger.disabled = false;
                        });
                    });

                    // Add-ons
                    const addonsContainer = document.getElementById('addonsContainer');
                    const noAddonsMessage = document.getElementById('noAddonsMessage');

                    function createAddonItem(name = '', price = '') {
                        const el = document.createElement('div');
                        el.className = 'addon-item';
                        el.innerHTML = `
                    <input type="text" value="${name}" data-addon-name placeholder="Add-on name">
                    <input type="number" value="${price}" data-addon-price placeholder="0.00">
                    <button type="button" data-remove-addon>X</button>
                `;
                        el.querySelector('[data-remove-addon]').addEventListener('click', () => {
                            el.remove();
                            updateMsg();
                        });
                        return el;
                    }

                    function updateMsg() {
                        const items = addonsContainer.querySelectorAll('.addon-item');
                        if (noAddonsMessage) {
                            noAddonsMessage.style.display = items.length === 0 ? 'block' : 'none';
                        }
                    }

                    if (product.addons && product.addons.length > 0) {
                        product.addons.forEach(a => {
                            addonsContainer.appendChild(createAddonItem(a.addonName, a.addonPrice));
                        });
                    }

                    document.getElementById('addAddonBtn').addEventListener('click', () => {
                        addonsContainer.appendChild(createAddonItem());
                        updateMsg();
                    });

                    updateMsg();
                },

                preConfirm: () => {
                    const name = document.getElementById('editProductName').value.trim();
                    const category = document.getElementById('selectedCategory').value;
                    const price = parseFloat(document.getElementById('editProductPrice').value);
                    const stock = parseInt(document.getElementById('editProductStock').value);
                    const imageUrl = document.getElementById('selectedImageUrl').value;

                    // Check for duplicate name error
                    const productNameError = document.getElementById('productNameError');
                    if (productNameError && productNameError.style.display === 'block') {
                        Swal.showValidationMessage('Please use a different product name. This name is already taken.');
                        return false;
                    }

                    if (!name || !category || !price || !stock) {
                        Swal.showValidationMessage('Please fill all fields');
                        return false;
                    }

                    if (name.length < 3) {
                        Swal.showValidationMessage('Product name must be at least 3 characters');
                        return false;
                    }

                    if (price <= 0) {
                        Swal.showValidationMessage('Price must be greater than 0');
                        return false;
                    }

                    const addonItems = document.querySelectorAll('.addon-item');
                    const customAddons = [];
                    addonItems.forEach(item => {
                        const n = item.querySelector('[data-addon-name]').value;
                        const p = parseFloat(item.querySelector('[data-addon-price]').value);
                        if (n.trim()) {
                            customAddons.push({
                                addonName: n.trim(),
                                addonPrice: isNaN(p) ? 0 : p
                            });
                        }
                    });

                    return {
                        name,
                        category,
                        price,
                        stock,
                        imageUrl,
                        customAddons
                    };
                }
            }).then(result => {
                if (result.isConfirmed && result.value) {
                    // Show loading state
                    Swal.fire({
                        title: 'Updating Product...',
                        text: 'Please wait while we update the product information.',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    const updatedProduct = {
                        ProductID: id,
                        Productname: result.value.name,
                        CategoryName: result.value.category,
                        Productprice: result.value.price,
                        InitialStock: result.value.stock,
                        Productpicpath: result.value.imageUrl,
                        Productpicfilename: result.value.imageUrl.split('/').pop(),
                        customAddons: result.value.customAddons
                    };

                    CoffeeShopService.updateProduct(updatedProduct).then(response => {
                        Swal.close();

                        if (response.data.Success) {
                            $scope.loadInventory();

                            Swal.fire({
                                title: 'Updated!',
                                text: response.data.Message,
                                icon: 'success',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        } else {
                            // Handle duplicate product name error
                            let errorMessage = response.data.Message;
                            if (errorMessage.toLowerCase().includes('name already exists')) {
                                Swal.fire({
                                    title: 'Duplicate Product Name!',
                                    html: `
                                <div style="text-align: left;">
                                    <p><strong>${errorMessage}</strong></p>
                                    <p style="margin-top: 10px; color: #666;">Please try again with a different product name.</p>
                                </div>
                            `,
                                    icon: 'error',
                                    confirmButtonColor: '#A8A54A',
                                    confirmButtonText: 'Try Again'
                                });
                            } else {
                                Swal.fire('Error', errorMessage, 'error');
                            }
                        }
                    }).catch(() => {
                        Swal.close();
                        Swal.fire('Error', 'Failed to update product', 'error');
                    });
                }
            });
        };


        //Delete Product
        $scope.deleteProduct = function (id) {
            const product = products.find(p => p.id === id);
            if (!product) return;

            Swal.fire({
                title: 'Delete Product?',
                text: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                backdrop: 'rgba(111, 78, 55, 0.1)'
            }).then((result) => {
                if (result.isConfirmed) {
                    CoffeeShopService.deleteProduct(id).then(function (response) {
                        if (response.data.Success) {
                            const index = products.findIndex(p => p.id === id);
                            products.splice(index, 1);
                            populateInventoryTable();

                            Swal.fire({
                                title: 'Deleted!',
                                text: `${product.name} has been deleted from inventory.`,
                                icon: 'success',
                                confirmButtonColor: '#A8A54A',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: response.data.Message,
                                icon: 'error',
                                confirmButtonColor: '#A8A54A'
                            });
                        }
                    }, function () {
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to delete product. Please try again.',
                            icon: 'error',
                            confirmButtonColor: '#A8A54A'
                        });
                    });
                }
            });
        };



        // Add product

        // Delete Order (hard delete)
        $scope.deleteOrder = function (orderId, orderCode) {
            Swal.fire({
                title: 'Delete Order Permanently?',
                html: `
            <div style="text-align: left;">
                <p><strong>Order #${orderCode}</strong> will be permanently deleted.</p>
                <p style="color: #dc3545; margin-top: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <strong>Warning:</strong> This action cannot be undone!
                </p>
                <p>All order data including items and add-ons will be removed from the database.</p>
                <p style="margin-top: 15px;">This action requires admin authorization.</p>
            </div>
        `,
                icon: 'error',
                input: 'password',
                inputLabel: 'Enter Admin Password',
                inputPlaceholder: 'Enter your admin password...',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: '<i class="fas fa-trash-alt"></i> Permanently Delete',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off',
                    autocomplete: 'off'
                },
                preConfirm: (password) => {
                    if (!password) {
                        Swal.showValidationMessage('Password is required');
                        return false;
                    }

                    // Show loading state
                    Swal.showLoading();

                    return CoffeeShopService.deleteOrder(orderId, password)
                        .then(response => {
                            if (!response.data.success) {
                                Swal.showValidationMessage(response.data.message || 'Invalid admin password');
                                return false;
                            }
                            return response.data;
                        })
                        .catch(error => {
                            console.error("Delete order error:", error);
                            Swal.showValidationMessage('Server error, please try again');
                            return false;
                        });
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    // Success - refresh the order history table
                    Swal.fire({
                        title: 'Order Deleted!',
                        html: `
                    Order #${orderCode} has been permanently deleted from the database.
                    <br><br>
                    <i class="fas fa-check-circle" style="color: #28a745;"></i>
                `,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // Refresh the order history DataTable
                        if ($.fn.DataTable.isDataTable('#AdminOrderHistoryTable')) {
                            $('#AdminOrderHistoryTable').DataTable().destroy();
                        }
                        $scope.getOrderHistory('AdminOrderHistoryTable');
                    });
                }
            });
        };
        $scope.voidOrder = function (orderId) {
            Swal.fire({
                title: 'Void Order?',
                text: `This will void order #${orderId}. This action requires admin authorization.`,
                icon: 'warning',
                input: 'password',
                inputLabel: 'Enter Admin Password',
                inputPlaceholder: 'Enter password...',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6F4E37',
                confirmButtonText: 'Void Order',
                cancelButtonText: 'Cancel',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                preConfirm: (password) => {
                    return $.ajax({
                        url: '/CoffeeShop/VoidOrder',
                        type: 'POST',
                        data: { orderId: orderId, password: password }
                    }).then(response => {
                        if (!response.success) {
                            Swal.showValidationMessage(response.message || 'Incorrect admin password');
                            return false;
                        }
                        return true;
                    }).catch(() => {
                        Swal.showValidationMessage('Server error, please try again');
                    });
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Order Voided!',
                        text: `Order #${orderId} has been voided successfully.`,
                        icon: 'success',
                        confirmButtonColor: '#A8A54A'
                    });
                    location.reload();
                }
            });
        }
    }]);


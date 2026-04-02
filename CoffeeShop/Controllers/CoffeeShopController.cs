using CoffeeShop.Models;
using CoffeeShop.Models.Context;
using CoffeeShop.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Management;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using System.Web.Security;
using Microsoft.AspNet.Identity;
using System.IO;


namespace CoffeeShop.Controllers
{
    public class CoffeeShopController : Controller
    {
        public ActionResult Index() { return View(); }
        public ActionResult Homepage() { return View(); }
        public ActionResult AboutPage() { return View(); }
        public ActionResult MenuPage() { return View(); }
        public ActionResult CoffeeCollectivesPage() { return View(); }
        public ActionResult ContactUsPage() { return View(); }
        public ActionResult RegistrationPage() { return View(); }
        public ActionResult LoginPage()
        {
            using (var db = new CoffeeShopContext())
            {
                bool hasAdmin = db.tbl_admin.Any();

                if (!hasAdmin)
                {
                    return View("RegistrationPage");
                }
                else
                {
                    return View();
                }
            }
        }
        public ActionResult CheckoutPage() { return View(); }
        public ActionResult TryPage() { return View(); }
        public ActionResult AdminHomepage()
        {
            ViewBag.HideNavbar = true;
            return View();
        }

        public JsonResult AddAdmin(tblAdminsModel adminData)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var hasher = new PasswordHasher();
                    string hashedPassword = hasher.HashPassword(adminData.Adminpassword);
                    var adminToSave = new tblAdminsModel
                    {
                        Adminname = adminData.Adminname,
                        Adminemail = adminData.Adminemail,
                        Adminpassword = hashedPassword,
                        Datecreated = DateTime.Now,
                        Dateupdated = DateTime.Now
                    };
                    db.tbl_admin.Add(adminToSave);
                    db.SaveChanges();
                }
                return Json(new { success = true, message = "Admin added successfully." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Failed to add admin: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult ValidateUser(string email, string uType, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var hasher = new PasswordHasher();
                    if (uType == "Admin")
                    {
                        var adminUser = db.tbl_admin.FirstOrDefault(u => u.Adminemail == email);
                        var result = hasher.VerifyHashedPassword(adminUser?.Adminpassword, password);
                        if (adminUser != null && (result == PasswordVerificationResult.Success))
                        {
                            Session["UserID"] = adminUser.AdminID;
                            Session["UserName"] = adminUser.Adminname;
                            Session["UserNickname"] = adminUser.Adminname.Split(' ')[0];
                            Session["UserContact"] = "";
                            Session["UserEmail"] = adminUser.Adminemail;
                            Session["UserType"] = "Admin";

                            var logEntry = new tblLogsModel
                            {
                                AdminID = adminUser.AdminID,
                                EmployeeID = 0,
                                Logaction = "Logged in",
                                Logdetails = $"Admin logged in",
                                Logtime = DateTime.Now.TimeOfDay,
                                Datecreated = DateTime.Now
                            };
                            LogFunction(logEntry);

                            return Json(new { success = true, message = "User exists." }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    else if (uType == "Employee")
                    {
                        var employeeUser = db.tbl_employee.FirstOrDefault(u => u.Employeeemail == email);

                        // Check if employee exists
                        if (employeeUser == null)
                        {
                            return Json(new { success = false, message = "Employee not found." }, JsonRequestBehavior.AllowGet);
                        }

                        // FIX: Check if employee is voided/disabled
                        if (employeeUser.IsDisabled == true)
                        {
                            return Json(new { success = false, message = "Your account has been disabled. Please contact the administrator." }, JsonRequestBehavior.AllowGet);
                        }

                        var result = hasher.VerifyHashedPassword(employeeUser?.Employeepassword, password);
                        if (employeeUser != null && (result == PasswordVerificationResult.Success))
                        {
                            // FIX: Update login tracking - set as logged in
                            employeeUser.IsCurrentlyLoggedIn = true;
                            employeeUser.LastLoginDate = DateTime.Now;
                            employeeUser.Dateupdated = DateTime.Now;
                            db.SaveChanges();

                            Session["UserID"] = employeeUser.EmployeeID;
                            Session["UserName"] = employeeUser.Employeename;
                            Session["UserNickname"] = employeeUser.Employeename.Split(' ')[0];
                            Session["UserContact"] = employeeUser.Employeecontact;
                            Session["UserEmail"] = employeeUser.Employeeemail;
                            Session["UserType"] = "Employee";

                            var logEntry = new tblLogsModel
                            {
                                AdminID = 0,
                                EmployeeID = employeeUser.EmployeeID,
                                Logaction = "Logged in",
                                Logdetails = $"Employee {employeeUser.Employeename} logged in",
                                Logtime = DateTime.Now.TimeOfDay,
                                Datecreated = DateTime.Now
                            };
                            LogFunction(logEntry);
                            return Json(new { success = true, message = "User exists." }, JsonRequestBehavior.AllowGet);
                        }
                        else
                        {
                            return Json(new { success = false, message = "Invalid password." }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    return Json(new { success = false, message = "User does not exist." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "User Validation Failed: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult EmployeeLogout(int employeeId)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var employee = db.tbl_employee.FirstOrDefault(e => e.EmployeeID == employeeId);
                    if (employee != null)
                    {
                        // Update login status to false
                        employee.IsCurrentlyLoggedIn = false;
                        employee.Dateupdated = DateTime.Now;
                        db.SaveChanges();

                        var logEntry = new tblLogsModel
                        {
                            AdminID = 0,
                            EmployeeID = employee.EmployeeID,
                            Logaction = "Logged out",
                            Logdetails = $"Employee {employee.Employeename} logged out",
                            Logtime = DateTime.Now.TimeOfDay,
                            Datecreated = DateTime.Now
                        };
                        LogFunction(logEntry);
                    }
                }
                return Json(new { success = true, message = "Logout recorded." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetProductQuantity(int productId)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var productQuantity = db.tbl_restock
                                            .Where(r => r.ProductID == productId)
                                            .Select(r => r.Quantity)
                                            .FirstOrDefault();

                    return Json(new
                    {
                        success = true,
                        quantity = productQuantity
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                var fullMessage = $"Message: {ex.Message}\n" +
                                  $"Inner: {ex.InnerException?.Message}\n" +
                                  $"StackTrace: {ex.StackTrace}";
                Console.WriteLine(fullMessage);
                return Json(new { success = false, message = fullMessage }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetAllProductsSales()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Get all products
                    var products = db.tbl_products.ToList();

                    // Get total sold and revenue for each product
                    var salesData = db.tbl_orderitems
                        .GroupBy(oi => oi.ProductID)
                        .Select(g => new
                        {
                            ProductID = g.Key,
                            TotalSold = g.Sum(x => x.Quantity),
                            TotalRevenue = g.Sum(x => x.Quantity * x.Price)
                        })
                        .ToList();

                    // Join products with sales data
                    var result = products
                        .GroupJoin(
                            salesData,
                            p => p.ProductID,
                            s => s.ProductID,
                            (p, s) => new
                            {
                                p.Productname,
                                TotalSold = s.FirstOrDefault() != null ? s.FirstOrDefault().TotalSold : 0,
                                TotalRevenue = s.FirstOrDefault() != null ? s.FirstOrDefault().TotalRevenue : 0
                            })
                        .OrderByDescending(x => x.TotalSold) // Optional: sort by sales
                        .ToList();

                    return Json(new { success = true, products = result }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }




        [HttpGet]
        public JsonResult GetSalesSummary()
        {
            using (var db = new CoffeeShopContext())
            {
                // 🔹 Define ranges explicitly
                var ranges = new[]
                {
            new { Label = "Today",
                  Start = DateTime.Today,
                  End = DateTime.Today.AddDays(1) },

            new { Label = "Yesterday",
                  Start = DateTime.Today.AddDays(-1),
                  End = DateTime.Today },

            // Rolling 7-day window (like your MySQL query)
            new { Label = "This Week",
                  Start = DateTime.Today.AddDays(-7),
                  End = DateTime.Today.AddDays(1) },

            // Calendar month
            new { Label = "This Month",
                  Start = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1),
                  End = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(1) }
        };

                var result = new List<object>();

                foreach (var r in ranges)
                {
                    // 🔹 1. Filter orders for this range
                    var ordersInRange = db.tbl_orders
                        .Where(o => o.Datecreated >= r.Start && o.Datecreated < r.End);

                    var orderIds = ordersInRange.Select(o => o.OrderID);

                    // 🔹 2. Compute order stats
                    var totalOrders = ordersInRange.Count();
                    var totalSales = ordersInRange.Sum(o => (decimal?)o.Ordertotal) ?? 0;
                    var avgOrderValue = totalOrders > 0
                ? Math.Round(totalSales / totalOrders, 2)   // ✅ Rounded to 2 decimals
                : 0;


                    // 🔹 3. Compute product totals
                    var productTotals = db.tbl_orderitems
                        .Where(oi => orderIds.Contains(oi.OrderID))
                        .GroupBy(oi => oi.ProductID)
                        .Select(g => new
                        {
                            ProductID = g.Key,
                            TotalQty = g.Sum(x => x.Quantity)
                        });

                    // 🔹 4. Get top product
                    var topProduct = (
                        from pt in productTotals
                        join p in db.tbl_products on pt.ProductID equals p.ProductID
                        orderby pt.TotalQty descending
                        select p.Productname
                    ).FirstOrDefault();

                    result.Add(new
                    {
                        Date = r.Label,
                        TotalOrders = totalOrders,
                        TotalSales = totalSales,
                        AvgOrderValue = avgOrderValue,
                        TopProduct = topProduct ?? "N/A"
                    });
                }

                return Json(new { success = true, data = result }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetUserSession()
        {
            var sessionData = new
            {
                UserID = Session["UserID"],
                UserName = Session["UserName"],
                UserNickname = Session["UserNickname"],
                UserContact = Session["UserContact"],
                UserEmail = Session["UserEmail"],
                UserType = Session["UserType"]  // Add this line
            };

            return Json(new { success = true, data = sessionData }, JsonRequestBehavior.AllowGet);
        }
        public JsonResult RemoveUserSession()
        {
            try
            {
                // Check if there's an employee logged in
                if (Session["UserType"] != null && Session["UserType"].ToString() == "Employee" && Session["UserID"] != null)
                {
                    int employeeId = Convert.ToInt32(Session["UserID"]);
                    using (var db = new CoffeeShopContext())
                    {
                        var employee = db.tbl_employee.FirstOrDefault(e => e.EmployeeID == employeeId);
                        if (employee != null)
                        {
                            employee.IsCurrentlyLoggedIn = false;
                            employee.Dateupdated = DateTime.Now;
                            db.SaveChanges();
                        }
                    }
                }

                // Clear all session data
                Session.Clear();
                Session.Abandon();

                return Json(new { success = true, message = "User logged out successfully." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Logout error: " + ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        //Verify Email
        [HttpPost]
        public async Task<JsonResult> VerifyEmail(string email, string uType)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    bool exists = false;

                    if (uType == "Admin")
                    {
                        exists = db.tbl_admin.Any(u => u.Adminemail == email);
                    }
                    else if (uType == "Employee")
                    {
                        exists = db.tbl_employee.Any(u => u.Employeeemail == email);
                    }

                    if (exists)
                    {
                        // Instead of returning here, just return whatever SendEmail returns
                        return await SendEmail(email);
                    }

                    return Json(new { success = false, message = "Email does not exist.", email = email, uType = uType }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Email Verification Failed: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetActivityLogs()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // First, get the raw data from database (without the custom method)
                    var logsRaw = (from l in db.tbl_log
                                   join a in db.tbl_admin on l.AdminID equals a.AdminID into adminJoin
                                   from admin in adminJoin.DefaultIfEmpty()
                                   join e in db.tbl_employee on l.EmployeeID equals e.EmployeeID into employeeJoin
                                   from employee in employeeJoin.DefaultIfEmpty()
                                   orderby l.Datecreated descending, l.Logtime descending
                                   select new
                                   {
                                       LogID = l.LogID,
                                       DateCreated = l.Datecreated,
                                       LogTime = l.Logtime,
                                       AdminName = admin != null ? admin.Adminname : null,
                                       EmployeeName = employee != null ? employee.Employeename : null,
                                       AdminID = l.AdminID,
                                       EmployeeID = l.EmployeeID,
                                       Logaction = l.Logaction,
                                       Logdetails = l.Logdetails
                                   })
                                   .Take(500) // Limit to last 500 logs for performance
                                   .ToList(); // Execute query first, then process in memory
                    
                    // Now process in memory to add Module and Role
                    var logs = logsRaw.Select(log => new
                    {
                        log.LogID,
                        log.DateCreated,
                        log.LogTime,
                        log.AdminName,
                        log.EmployeeName,
                        Role = log.AdminID > 0 ? "Admin" : (log.EmployeeID > 0 ? "Employee" : "System"),
                        Module = GetModuleFromActionInMemory(log.Logaction),
                        Action = log.Logaction,
                        Description = log.Logdetails
                    }).ToList();

                    return Json(new { success = true, data = logs }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        // Helper method for in-memory processing (no LINQ to Entities translation needed)
        private string GetModuleFromActionInMemory(string action)
        {
            if (string.IsNullOrEmpty(action)) return "General";

            action = action.ToLower();

            if (action.Contains("login") || action.Contains("logout"))
                return "Authentication";
            if (action.Contains("order"))
                return "Orders";
            if (action.Contains("product"))
                return "Products";
            if (action.Contains("employee"))
                return "Employees";
            if (action.Contains("password") || action.Contains("reset"))
                return "Security";
            if (action.Contains("stock"))
                return "Inventory";

            return "General";
        }

        // Helper method to determine module from action
        private string GetModuleFromAction(string action)
        {
            if (string.IsNullOrEmpty(action)) return "General";

            action = action.ToLower();

            if (action.Contains("login") || action.Contains("logout"))
                return "Authentication";
            if (action.Contains("order"))
                return "Orders";
            if (action.Contains("product"))
                return "Products";
            if (action.Contains("employee"))
                return "Employees";
            if (action.Contains("password") || action.Contains("reset"))
                return "Security";
            if (action.Contains("stock"))
                return "Inventory";

            return "General";
        }

        //Email Logic
        private readonly EmailService _emailService = new EmailService();

        [HttpPost]
        public async Task<JsonResult> SendEmail(string email)
        {
            try
            {
                // Generate OTP
                var otpCode = new Random().Next(100000, 999999).ToString();

                // Send email
                await _emailService.SendEmailAsync(email, "Your CoffeeShop OTP Code", otpCode);

                // Store OTP in session
                Session["OtpCode"] = otpCode;
                Session["OtpExpiry"] = DateTime.Now.AddMinutes(2);

                // Create log entry
                var logEntry = new tblLogsModel
                {
                    AdminID = 0,
                    EmployeeID = 0,
                    Logaction = "Reset Password",
                    Logdetails = $"OTP sent to {email}",
                    Logtime = DateTime.Now.TimeOfDay,
                    Datecreated = DateTime.Now
                };
                LogFunction(logEntry);

                // Unified response
                return Json(new { success = true, message = "OTP sent and log saved." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Failed to send email: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }


        public JsonResult ValidateOTP(string enteredOtp)
        {
            var storedOtp = Session["OtpCode"]?.ToString();
            var expiry = (DateTime?)Session["OtpExpiry"];

            if (storedOtp != null && expiry.HasValue)
            {
                if (DateTime.Now <= expiry.Value && enteredOtp == storedOtp)
                {
                    // Kailangan i-remove din ang session after verfication
                    Session.Remove("OtpCode");
                    Session.Remove("OtpExpiry");
                    return Json(new { success = true, message = "OTP verified successfully" }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    // Expired na ang OTP or invalid
                    //Session.Remove("OtpCode");
                    //Session.Remove("OtpExpiry");
                    return Json(new { success = false, message = "Invalid or expired OTP" }, JsonRequestBehavior.AllowGet);
                }
            }

            return Json(new { success = false, message = "No OTP found" }, JsonRequestBehavior.AllowGet);

        }

        //Debug OTP
        public JsonResult GetOtp()
        {
            var storedOtp = Session["OtpCode"]?.ToString();
            return Json(new { otp = storedOtp }, JsonRequestBehavior.AllowGet); //returns the generated otp
        }
        public JsonResult DeleteOTP()
        {
            Session.Remove("OtpCode");
            return Json(new { otp = "" }, JsonRequestBehavior.AllowGet); //return an empty string
        }

        //Update Password
        public JsonResult UpdatePassword(string email, string uType, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var hasher = new PasswordHasher();
                    string hashedPassword = null;
                    if (uType == "Admin")
                    {
                        var adminUser = db.tbl_admin.FirstOrDefault(u => u.Adminemail == email);
                        if (adminUser != null)
                        {
                            hashedPassword = hasher.HashPassword(password);

                            adminUser.Adminpassword = hashedPassword;
                            db.SaveChanges();

                            var logEntry = new tblLogsModel
                            {
                                AdminID = adminUser.AdminID,
                                EmployeeID = 0,
                                Logaction = "Updated Password",
                                Logdetails = $"Password successfully updated for account: {email}",
                                Logtime = DateTime.Now.TimeOfDay,
                                Datecreated = DateTime.Now
                            };
                            LogFunction(logEntry);

                            return Json(new { success = true, message = "Password Updated." }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    else if (uType == "Employee")
                    {
                        var employeeUser = db.tbl_employee.FirstOrDefault(u => u.Employeeemail == email);
                        if (employeeUser != null)
                        {
                            hashedPassword = hasher.HashPassword(password);

                            employeeUser.Employeepassword = hashedPassword;
                            db.SaveChanges();

                            var logEntry = new tblLogsModel
                            {
                                AdminID = 0,
                                EmployeeID = employeeUser.EmployeeID,
                                Logaction = "Updated Password",
                                Logdetails = $"Password successfully updated for account: {email}",
                                Logtime = DateTime.Now.TimeOfDay,
                                Datecreated = DateTime.Now
                            };
                            LogFunction(logEntry);

                            return Json(new { success = true, message = "Password Updated." }, JsonRequestBehavior.AllowGet);
                        }
                    }
                    return Json(new { success = false, message = "Email does not exist.", email = email, uType = uType }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Email Verification Failed: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }

        }

        public JsonResult LogFunction(tblLogsModel log)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // If you want to store names directly, you can add Name fields to your tbl_log table
                    // For now, we'll store IDs and join later
                    db.tbl_log.Add(log);
                    db.SaveChanges();
                }

                return Json(new { success = true, message = "Log successfully added." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Log Failed: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaveOrderItem(tblOrderItemsModel orderItemData, string dateNow, string paymentMethod, string gcashRef, float? cashTendered = null, float? changeAmount = null)
        {
            try
            {
                float tendered = cashTendered ?? 0f;
                float change = changeAmount ?? 0f;
                DateTime parsedCurrentDate = DateTime.Now;
                var match = System.Text.RegularExpressions.Regex.Match(dateNow, @"\/Date\((\d+)\)\/");
                if (match.Success)
                {
                    long ms = long.Parse(match.Groups[1].Value);
                    parsedCurrentDate = new DateTime(1970, 1, 1).AddMilliseconds(ms).ToLocalTime();
                }

                using (var db = new CoffeeShopContext())
                {
                    string drinkTypeValue = orderItemData.DrinkType;
                    if (string.IsNullOrEmpty(drinkTypeValue))
                    {
                        drinkTypeValue = "N/A";
                    }

                    var orderItemToSave = new tblOrderItemsModel
                    {
                        OrderID = Convert.ToInt32(Session["OrderID"]),
                        ProductID = orderItemData.ProductID,
                        DrinkType = drinkTypeValue,
                        Quantity = orderItemData.Quantity,
                        Addons = orderItemData.Addons,
                        Price = orderItemData.Price,
                        Datecreated = parsedCurrentDate,
                        Dateupdated = parsedCurrentDate
                    };

                    db.tbl_orderitems.Add(orderItemToSave);
                    db.SaveChanges();

                    //Session.Remove("OrderID");
                    //Session.Remove("OrderCode");
                    //DeleteOrderSession();
                }

                using (var db = new CoffeeShopContext())
                {
                    var transactionToSave = new tblTransactionsModel
                    {
                        OrderID = orderItemData.OrderID,
                        EmployeeID = Convert.ToInt32(Session["UserID"]),
                        ProductID = orderItemData.ProductID,
                        Quantitysold = orderItemData.Quantity,
                        Transactiontype = paymentMethod,
                        GCashRef = gcashRef ?? "0",
                        AmountPaid = cashTendered ?? 0f,
                        AmountChange = changeAmount ?? 0f,
                        Datecreated = parsedCurrentDate,
                        Dateupdated = parsedCurrentDate
                    };

                    db.tbl_transaction.Add(transactionToSave);
                    db.SaveChanges();
                }

                return Json(new { success = true, message = "Order Item successfully added.." }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Order item failed to be added: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult SaveOrder(tblOrdersModel orderData)
        {
            try
            {
                DateTime dateTime = DateTime.Now;
                using (var db = new CoffeeShopContext())
                {
                    string shortYear = DateTime.Now.ToString("yy");
                    Random rnd = new Random();
                    int randomNumber = rnd.Next(100000, 999999);
                    int orderCode = int.Parse($"{shortYear}{randomNumber}");

                    var orderToSave = new tblOrdersModel
                    {
                        EmployeeID = orderData.EmployeeID,
                        Ordercode = orderCode,
                        Ordertype = orderData.Ordertype,
                        Ordertotal = orderData.Ordertotal,
                        Orderstatus = orderData.Orderstatus,
                        Datecreated = dateTime,
                        Dateupdated = dateTime
                    };

                    db.tbl_orders.Add(orderToSave);
                    db.SaveChanges();

                    Session["OrderID"] = orderToSave.OrderID;
                    Session["OrderCode"] = orderToSave.Ordercode;
                    Session["EmployeeID"] = orderToSave.EmployeeID;

                    var logEntry = new tblLogsModel
                    {
                        AdminID = 0,
                        EmployeeID = orderData.EmployeeID,
                        Logaction = "Placed Order",
                        Logdetails = $"Order #{orderCode} has been successfully added!",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);
                }

                return Json(new { success = true, message = "Order successfully added..", dateTime = dateTime, orderId = Session["OrderID"], orderCode = Session["OrderCode"] }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Order failed to be added: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        // Delete Order (hard delete - removes from database)
        [HttpPost]
        public JsonResult DeleteOrder(int orderId, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Validate password is provided
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        return Json(new { success = false, message = "Password is required." }, JsonRequestBehavior.AllowGet);
                    }

                    // Get the admin account (assuming there's only one admin)
                    var hasher = new PasswordHasher();
                    var admin = db.tbl_admin.OrderBy(a => a.AdminID).FirstOrDefault();
                    if (admin == null)
                    {
                        return Json(new { success = false, message = "No admin account found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Verify admin password
                    var result = hasher.VerifyHashedPassword(admin.Adminpassword, password);
                    if (result != PasswordVerificationResult.Success)
                    {
                        return Json(new { success = false, message = "Incorrect admin password." }, JsonRequestBehavior.AllowGet);
                    }

                    // Find the order
                    var order = db.tbl_orders.FirstOrDefault(o => o.OrderID == orderId);
                    if (order == null)
                    {
                        return Json(new { success = false, message = "Order not found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Store order details for logging before deletion
                    var orderCode = order.Ordercode;
                    var orderTotal = order.Ordertotal;
                    var orderDate = order.Datecreated;

                    // Delete order items first (due to foreign key constraint)
                    var orderItems = db.tbl_orderitems.Where(i => i.OrderID == orderId);
                    db.tbl_orderitems.RemoveRange(orderItems);

                    // Then delete the order
                    db.tbl_orders.Remove(order);
                    db.SaveChanges();

                    // Log the deletion
                    var logEntry = new tblLogsModel
                    {
                        AdminID = admin.AdminID,
                        EmployeeID = 0,
                        Logaction = "Delete Order",
                        Logdetails = $"Order #{orderCode} (Total: ₱{orderTotal}, Date: {orderDate}) has been permanently deleted by admin {admin.Adminname}",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);

                    return Json(new { success = true, message = "Order permanently deleted successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetOrderSession()
        {
            var orderIDSession = Session["OrderID"];
            return Json(new { orderID = orderIDSession }, JsonRequestBehavior.AllowGet);
        }
        public JsonResult DeleteOrderSession()
        {
            Session.Remove("orderIDSession");
            return Json(new { session = Session["OrderID"] != null ? "Order session still exists." : "No value found" }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public JsonResult UpdateStockItems(List<StockUpdateDto> tempArray)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    //if (tempArray == null || !tempArray.Any())
                    //{
                    //    return Json(new { success = false, message = "No stock items provided." }, JsonRequestBehavior.AllowGet);
                    //}

                    foreach (var item in tempArray)
                    {
                        var stockItem = db.tbl_restock.FirstOrDefault(s => s.ProductID == item.ProductId);
                        if (stockItem != null)
                        {
                            // Deduct based on quantity
                            stockItem.Quantity -= item.Quantity;
                            stockItem.Dateupdated = DateTime.Now;
                        }
                    }

                    db.SaveChanges();
                    return Json(new { success = true, message = "Stock updated successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetOrderHistory()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var orders = db.tbl_orders
                        .OrderByDescending(o => o.Datecreated)
                        .Select(o => new
                        {
                            OrderID = o.OrderID,
                            Ordercode = o.Ordercode,
                            Datecreated = o.Datecreated,
                            Ordertotal = o.Ordertotal,
                            Orderstatus = o.Orderstatus,

                            Orderitems = (from i in db.tbl_orderitems
                                          join p in db.tbl_products on i.ProductID equals p.ProductID
                                          where i.OrderID == o.OrderID
                                          select new
                                          {
                                              ProductID = i.ProductID,
                                              ProductName = p.Productname,
                                              Quantity = i.Quantity,
                                              Price = i.Price,
                                              Addons = i.Addons
                                          }).ToList()

                        }).ToList();

                    return Json(new { success = true, data = orders }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;

                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetOrderDetails()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var orders = db.tbl_orders
                        .OrderByDescending(o => o.Datecreated)
                        .Select(o => new
                        {
                            OrderID = o.OrderID,
                            Ordercode = o.Ordercode,
                            Ordertype = o.Ordertype,
                            DateCreated = o.Datecreated,   // keep as DateTime
                            Ordertotal = o.Ordertotal,
                            Orderstatus = o.Orderstatus,

                            Orderitems = (from i in db.tbl_orderitems
                                          join p in db.tbl_products on i.ProductID equals p.ProductID
                                          where i.OrderID == o.OrderID
                                          select new
                                          {
                                              ProductID = i.ProductID,
                                              ProductName = p.Productname,
                                              Quantity = i.Quantity,
                                              Price = i.Price,
                                              Addons = i.Addons // keep as raw string
                                          }).ToList(),

                            OrderTransaction = (from t in db.tbl_transaction
                                                 where t.OrderID == o.OrderID
                                                select new
                                                {
                                                    TransactionID = t.TransactionID,
                                                    Transactiontype = t.Transactiontype,
                                                    GCashRef = t.GCashRef == "0" ? "N/A" : "#" + t.GCashRef,
                                                    AmountPaid = t.AmountPaid,
                                                    AmountChange = t.AmountChange
                                                }),

                            Employee = db.tbl_employee
                                         .Where(e => e.EmployeeID == o.EmployeeID)
                                         .Select(e => e.Employeename)
                                         .FirstOrDefault(),
                        })
                        .ToList();

                    return Json(new { success = true, data = orders }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult VoidOrder(int orderId, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        return Json(new { success = false, message = "Password is required." }, JsonRequestBehavior.AllowGet);
                    }

                    var hasher = new PasswordHasher();
                    var admin = db.tbl_admin.OrderBy(a => a.AdminID).FirstOrDefault();
                    if (admin == null)
                    {
                        return Json(new { success = false, message = "No admin account found." }, JsonRequestBehavior.AllowGet);
                    }

                    var result = hasher.VerifyHashedPassword(admin.Adminpassword, password);
                    if (result != PasswordVerificationResult.Success)
                    {
                        return Json(new { success = false, message = "Incorrect admin password." }, JsonRequestBehavior.AllowGet);
                    }

                    var order = db.tbl_orders.FirstOrDefault(o => o.OrderID == orderId);
                    if (order == null)
                    {
                        return Json(new { success = false, message = "Order not found." }, JsonRequestBehavior.AllowGet);
                    }

                    order.Orderstatus = "Voided";
                    db.SaveChanges();

                    var logEntry = new tblLogsModel
                    {
                        AdminID = admin.AdminID,
                        EmployeeID = 42,
                        Logaction = "Void Order",
                        Logdetails = $"Order #{order.Ordercode} voided by admin {admin.Adminname}",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);

                    return Json(new { success = true, message = "Order voided successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetProductDetails()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var prodctDetailsData = db.tbl_products
                        .OrderByDescending(o => o.Datecreated)
                        .Select(o => new
                        {
                            ProductID = o.ProductID,
                            Productname = o.Productname,
                            Productprice = o.Productprice,
                            Productpicpath = o.Productpicpath,
                            Productpicfilename = o.Productpicfilename,
                            ProductCategory = db.tbl_category
                                                .Where(c => c.ProductID == o.ProductID)
                                                .Select(c => c.Categoryname)
                                                .FirstOrDefault(),
                            ProductImageUrl = o.Productpicpath + o.Productpicfilename,
                            ProductAddOns = db.tbl_addon
                                                .Where(a => a.ProductID == o.ProductID)
                                                .Select(a => new {
                                                    a.addonID,
                                                    a.addonName,
                                                    a.addonPrice
                                                })
                                                .ToList(),
                            ProductQuantity = db.tbl_restock
                                                .Where(r => r.ProductID == o.ProductID)
                                                .Select(r => r.Quantity)
                                                .FirstOrDefault(),
                        }).ToList();

                    if (prodctDetailsData == null)
                    {
                        return Json(new { success = false, message = "No products yet." },
                                    JsonRequestBehavior.AllowGet);
                    }

                    return Json(new
                    {
                        success = true,
                        data = prodctDetailsData
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                var fullMessage = $"Message: {ex.Message}\n" +
                                  $"Inner: {ex.InnerException?.Message}\n" +
                                  $"StackTrace: {ex.StackTrace}";
                Console.WriteLine(fullMessage);
                return Json(new { success = false, message = fullMessage }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetProductInventory()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var products = db.tbl_products
                        .OrderByDescending(o => o.Datecreated)
                        .Select(o => new
                        {
                            ProductID = o.ProductID,
                            Productname = o.Productname,
                            CategoryName = db.tbl_category
                                                .Where(c => c.ProductID == o.ProductID)
                                                .Select(c => c.Categoryname)
                                                .FirstOrDefault(),
                            Productprice = o.Productprice,
                            Stock = db.tbl_restock
                                                .Where(r => r.ProductID == o.ProductID)
                                                .Select(r => r.Quantity)
                                                .FirstOrDefault(),
                            Productpicpath = o.Productpicpath,
                            Status = db.tbl_restock.Any(r => r.ProductID == o.ProductID && r.Quantity > 0) ? "active" : "inactive",
                            Addons = db.tbl_addon
                                                .Where(a => a.ProductID == o.ProductID)
                                                .Select(a => new
                                                {
                                                    AddonID = a.addonID,
                                                    AddonName = a.addonName,
                                                    AddonPrice = a.addonPrice
                                                }).ToList()
                        })
                        .ToList();

                    return Json(new { success = true, data = products }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }




        // REGISTRATION LOGIC 
        //public JsonResult VerifyConnection(tblUsersModel userInfo)
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            var existingUser = db.tbl_users.FirstOrDefault(u => u.NameUser == userInfo.NameUser);
        //            if (existingUser != null)
        //            {
        //                return Json(new { success = false, message = "Username already exists. Please choose another." }, JsonRequestBehavior.AllowGet);
        //            }

        //            byte[] passwordHash, passwordSalt;
        //            CreatePasswordHash(userInfo.Password, out passwordHash, out passwordSalt);
        //            var userToSave = new tblUsersModel
        //            {
        //                Fname = userInfo.Fname,
        //                Lname = userInfo.Lname,
        //                Address = userInfo.Address,
        //                Cnumber = userInfo.Cnumber,
        //                NameUser = userInfo.NameUser,
        //                ProfilePicUrl = userInfo.ProfilePicUrl,
        //                PasswordHash = passwordHash,
        //                PasswordSalt = passwordSalt,

        //                DateCreated = DateTime.Now,
        //                DateUpdated = DateTime.Now
        //            };

        //            db.tbl_users.Add(userToSave);
        //            db.SaveChanges(); 
        //        }

        //        return Json(new { success = true, message = "User registered successfully." }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception ex)
        //    {
        //        string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
        //        return Json(new { success = false, message = "Registration Failed: " + errorMsg }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        //private void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        //{
        //    using (var hmac = new System.Security.Cryptography.HMACSHA512())
        //    {
        //        passwordSalt = hmac.Key;
        //        passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        //    }
        //}


        //// --- LOGIN 
        //public ActionResult Login(string Username, string Password)
        //{
        //    try
        //    {
        //        if (Username == "admin" && Password == "admin123")
        //        {
        //            return RedirectToAction("AdminHomepage", "CoffeeShop");
        //        }

        //        using (var db = new CoffeeShopContext())
        //        {
        //            var user = db.tbl_users.FirstOrDefault(u => u.NameUser == Username);
        //            if (user != null && VerifyPasswordHash(Password, user.PasswordHash, user.PasswordSalt))
        //            {
        //                FormsAuthentication.SetAuthCookie(user.NameUser, false);

        //                Session["UserFname"] = user.Fname;
        //                Session["UserProfilePicUrl"] = user.ProfilePicUrl;
        //                Session["UserId"] = user.UserID;

        //                return RedirectToAction("Homepage", "CoffeeShop");
        //            }
        //        }

        //        TempData["LoginError"] = "Invalid username or password.";
        //        return RedirectToAction("LoginPage", "CoffeeShop");
        //    }
        //    catch (Exception ex)
        //    {
        //        TempData["LoginError"] = "Login Error: " + ex.Message;
        //        return RedirectToAction("LoginPage", "CoffeeShop");
        //    }
        //}

        //private bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
        //{
        //    if (storedHash == null || storedSalt == null) return false;

        //    using (var hmac = new System.Security.Cryptography.HMACSHA512(storedSalt))
        //    {
        //        var computedHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        //        for (int i = 0; i < computedHash.Length; i++)
        //        {
        //            if (computedHash[i] != storedHash[i]) return false;
        //        }
        //    }
        //    return true;
        //}

        //// --- LOGOUT ---
        //public ActionResult Logout()
        //{
        //    FormsAuthentication.SignOut();
        //    Session.Clear();
        //    Session.Abandon();
        //    Response.Cache.SetExpires(DateTime.UtcNow.AddMinutes(-1));
        //    Response.Cache.SetCacheability(HttpCacheability.NoCache);
        //    Response.Cache.SetNoStore();

        //    return RedirectToAction("LoginPage", "CoffeeShop");


        //}

        //public JsonResult RemoveFromCart(int orderId)
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            //Find the order in the database
        //            var orderItem = db.tbl_order.FirstOrDefault(x => x.OrderID == orderId);

        //            if (orderItem != null)
        //            {
        //                db.tbl_order.Remove(orderItem);
        //                db.SaveChanges();
        //                return Json(new { success = true, message = "Item removed." });
        //            }
        //            return Json(new { success = false, message = "Item not found." });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, message = "Error: " + ex.Message });
        //    }
        //}

        //// SAVE ORDER TO CART
        //public ActionResult SaveOrder(tblOrderModel orderInfo)
        //{
        //    try
        //    {
        //        if (Session["UserId"] == null)
        //            return Json(new { success = false, message = "Please login first!" }, JsonRequestBehavior.AllowGet);

        //        int currentUserId = Convert.ToInt32(Session["UserId"]);

        //        using (var db = new CoffeeShopContext())
        //        {
        //            var orderToSave = new tblOrderModel
        //            {
        //                OrderName = orderInfo.OrderName,
        //                OrderPrice = orderInfo.OrderPrice,
        //                OrderQuantity = orderInfo.OrderQuantity,
        //                OrderSize = orderInfo.OrderSize,
        //                UserID = currentUserId,
        //                DateCreated = DateTime.Now,
        //                DateUpdated = DateTime.Now,
        //                OrderImage = orderInfo.OrderImage,
        //                CheckoutID = 0 // 0 means it is in the cart (not paid yet)
        //            };

        //            db.tbl_order.Add(orderToSave);
        //            db.SaveChanges();

        //            return Json(new { success = true, message = "Order added to cart successfully!" }, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        //// --- GET CART ITEMS ---
        //public JsonResult GetOrders()
        //{
        //    try
        //    {
        //        if (Session["UserId"] == null) return Json(new List<tblOrderModel>(), JsonRequestBehavior.AllowGet);

        //        int currentUserId = Convert.ToInt32(Session["UserId"]);

        //        using (var db = new CoffeeShopContext())
        //        {
        //            var list = db.tbl_order.Where(x => x.UserID == currentUserId && x.CheckoutID == 0).ToList();
        //            return Json(list, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch
        //    {
        //        return Json(new List<tblOrderModel>(), JsonRequestBehavior.AllowGet);
        //    }
        //}

        //// --- CHECKOUT / PLACE ORDER ---
        //public ActionResult PlaceOrder(string totalAmount, string paymentMethod)
        //{
        //    try
        //    {
        //        if (Session["UserId"] == null)
        //            return Json(new { success = false, message = "Please login first." });

        //        int currentUserId = Convert.ToInt32(Session["UserId"]);

        //        using (var db = new CoffeeShopContext())
        //        {
        //            var checkoutRecord = new tblCheckoutModel
        //            {
        //                TotalAmount = totalAmount,
        //                PaymentMethod = paymentMethod,
        //                OrderStatus = "Pending",
        //                DateCreated = DateTime.Now,
        //                DateUpdated = DateTime.Now,
        //                OrderID = currentUserId
        //            };

        //            db.tbl_checkout.Add(checkoutRecord);
        //            db.SaveChanges();

        //            int newReceiptId = checkoutRecord.CheckoutID;

        //            var cartItems = db.tbl_order.Where(x => x.UserID == currentUserId && x.CheckoutID == 0).ToList();

        //            foreach (var item in cartItems)
        //            {
        //                item.CheckoutID = newReceiptId;
        //                item.DateUpdated = DateTime.Now;
        //            }

        //            db.SaveChanges();

        //            return Json(new { success = true, message = "Order placed successfully!" });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, message = "Error: " + ex.Message });
        //    }
        //}

        //// --- DASHBOARD CHARTS ---
        //public JsonResult GetChartData()
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            var sevenDaysAgo = DateTime.Now.AddDays(-6).Date;

        //            var rawData = db.tbl_checkout
        //              .Where(x => x.DateCreated >= sevenDaysAgo)
        //              .ToList();

        //            var groupedData = rawData.GroupBy(x => x.DateCreated.Date)
        //              .Select(g => new
        //              {
        //                  Date = g.Key.ToString("MMM dd"),
        //                  Revenue = g.Sum(x => double.Parse(x.TotalAmount ?? "0")),
        //                  Orders = g.Count()
        //              })
        //              .OrderBy(x => x.Date)
        //              .ToList();

        //            var finalResult = new List<object>();
        //            for (int i = 6; i >= 0; i--)
        //            {
        //                var dateToCheck = DateTime.Now.AddDays(-i).Date;
        //                var dateString = dateToCheck.ToString("MMM dd");
        //                var existingData = groupedData.FirstOrDefault(x => x.Date == dateString);

        //                if (existingData != null)
        //                    finalResult.Add(existingData);
        //                else
        //                    finalResult.Add(new { Date = dateString, Revenue = 0, Orders = 0 });
        //            }

        //            int customerCount = db.tbl_users.Count();

        //            return Json(new { chartData = finalResult, totalCustomers = customerCount }, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}
        //[HttpGet]
        //public JsonResult GetAllProducts()
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            // Fetch all items from tbl_addproducts
        //            var products = db.tbl_addproducts
        //                             .OrderByDescending(x => x.DateCreated) 
        //                             .ToList();

        //            return Json(products, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, message = "Error: " + ex.Message }, JsonRequestBehavior.AllowGet);
        //    }
        //}

        //public JsonResult AddProduct(tblAddProductsModel productData)
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            productData.DateCreated = DateTime.Now;
        //            productData.DateUpdated = DateTime.Now;
        //            db.tbl_addproducts.Add(productData);
        //            db.SaveChanges();

        //            return Json(new { success = true, message = "Product added successfully!" });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        var msg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
        //        return Json(new { success = false, message = "Failed to add: " + msg });
        //    }
        //}


        //public JsonResult DeleteProduct(int id)
        //{
        //    try
        //    {
        //        using (var db = new CoffeeShopContext())
        //        {
        //            var product = db.tbl_addproducts.FirstOrDefault(x => x.ProductID == id);

        //            if (product != null)
        //            {
        //                try
        //                {
        //                    db.tbl_addproducts.Remove(product);
        //                    db.SaveChanges();
        //                    return Json(new { success = true, message = "Product deleted." });
        //                }
        //                catch (Exception innerEx)
        //                {
        //                    return Json(new { success = false, message = "Cannot delete: This item has been ordered by customers. You should archive it instead." });
        //                }
        //            }

        //            return Json(new { success = false, message = "Product not found." });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return Json(new { success = false, message = "Error deleting: " + ex.Message });
        //    }
        //}
        public JsonResult Upload()
        {
            try
            {
                if (Request.Files.Count == 0)
                    return Json(new { Success = false, Message = "No file uploaded" });

                var file = Request.Files[0];
                if (file == null || file.ContentLength == 0)
                    return Json(new { Success = false, Message = "Empty file" });

                // Generate a GUID for the file name
                var fileGuid = Guid.NewGuid().ToString();
                var fileExtension = Path.GetExtension(file.FileName); // Get file extension
                var fileName = fileGuid + fileExtension; // Combine GUID and file extension

                var uploadPath = Server.MapPath("~/Content/Uploads/"); // Make sure folder exists
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                var fullPath = Path.Combine(uploadPath, fileName);
                file.SaveAs(fullPath);

                // Return virtual path for DB storage
                return Json(new
                {
                    Success = true,
                    FileName = fileName,
                    FilePath = "/Content/Uploads/" + fileName
                });
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message });
            }
        }



        //Employee functions

        // Add Employee
        [HttpPost]
        public JsonResult addEmployee(employeeInformation employeeInfo)
        {
            try
            {
                if (employeeInfo == null)
                    return Json(new { Success = false, Message = "Employee data is null" });

                using (var db = new CoffeeShopContext())
                {
                    // Check for duplicate email (only check non-disabled employees)
                    bool emailExists = db.tbl_employee.Any(e =>
                        e.Employeeemail == employeeInfo.Employeeemail &&
                        e.IsDisabled == false);

                    if (emailExists)
                    {
                        return Json(new
                        {
                            Success = false,
                            Message = "Email address is already registered. Please use a different email address."
                        });
                    }

                    var hasher = new PasswordHasher();
                    string hashedPassword = hasher.HashPassword(employeeInfo.Employeepassword);

                    var newEmployee = new tblEmployeesModel()
                    {
                        Employeename = employeeInfo.Employeename,
                        Employeecontact = employeeInfo.Employeecontact,
                        Employeeemail = employeeInfo.Employeeemail,
                        Employeepassword = hashedPassword,
                        IsDisabled = false,              // New employee is not disabled
                        IsCurrentlyLoggedIn = false,      // Not logged in initially
                        LastLoginDate = null,             // No login history yet
                        Datecreated = DateTime.Now,
                        Dateupdated = DateTime.Now
                    };

                    db.tbl_employee.Add(newEmployee);
                    db.SaveChanges();

                    var employeeData = new
                    {
                        id = newEmployee.EmployeeID,
                        name = newEmployee.Employeename,
                        contact = newEmployee.Employeecontact,
                        email = newEmployee.Employeeemail,
                        isDisabled = newEmployee.IsDisabled,
                        isCurrentlyLoggedIn = newEmployee.IsCurrentlyLoggedIn,
                        lastLoginDate = newEmployee.LastLoginDate
                    };

                    return Json(new
                    {
                        Success = true,
                        Message = "Employee added successfully!",
                        Employee = employeeData,
                        Id = newEmployee.EmployeeID
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    Success = false,
                    Message = "Failed to save employee: " + ex.Message
                });
            }
        }
        public JsonResult GetEmployees()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var employees = db.tbl_employee
                        .Select(e => new
                        {
                            id = e.EmployeeID,
                            name = e.Employeename,
                            contact = e.Employeecontact,
                            email = e.Employeeemail,
                            isDisabled = e.IsDisabled,
                            isCurrentlyLoggedIn = e.IsCurrentlyLoggedIn,
                            lastLoginDate = e.LastLoginDate
                        })
                        .OrderByDescending(e => e.isCurrentlyLoggedIn)
                        .ThenByDescending(e => e.lastLoginDate)
                        .ToList();

                    return Json(new { Success = true, Employees = employees }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        // Void Employee (soft delete - disable account)
        [HttpPost]
        public JsonResult VoidEmployee(int employeeId, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Validate password
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        return Json(new { success = false, message = "Password is required." }, JsonRequestBehavior.AllowGet);
                    }

                    // Get admin account
                    var hasher = new PasswordHasher();
                    var admin = db.tbl_admin.OrderBy(a => a.AdminID).FirstOrDefault();
                    if (admin == null)
                    {
                        return Json(new { success = false, message = "No admin account found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Verify admin password
                    var result = hasher.VerifyHashedPassword(admin.Adminpassword, password);
                    if (result != PasswordVerificationResult.Success)
                    {
                        return Json(new { success = false, message = "Incorrect admin password." }, JsonRequestBehavior.AllowGet);
                    }

                    // Find the employee
                    var employee = db.tbl_employee.FirstOrDefault(e => e.EmployeeID == employeeId);
                    if (employee == null)
                    {
                        return Json(new { success = false, message = "Employee not found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Check if already voided
                    if (employee.IsDisabled == true)
                    {
                        return Json(new { success = false, message = "Employee is already voided." }, JsonRequestBehavior.AllowGet);
                    }

                    // Store employee details for logging
                    var employeeName = employee.Employeename;
                    var employeeEmail = employee.Employeeemail;

                    // Soft delete - mark as disabled and force logout
                    employee.IsDisabled = true;
                    employee.IsCurrentlyLoggedIn = false;
                    employee.Dateupdated = DateTime.Now;
                    db.SaveChanges();

                    // Log the action
                    var logEntry = new tblLogsModel
                    {
                        AdminID = admin.AdminID,
                        EmployeeID = 0,
                        Logaction = "Void Employee",
                        Logdetails = $"Employee '{employeeName}' (Email: {employeeEmail}, ID: {employeeId}) has been voided by admin {admin.Adminname}",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);

                    return Json(new { success = true, message = "Employee voided successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        // Reactivate Employee (undo void)
        [HttpPost]
        public JsonResult ReactivateEmployee(int employeeId, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Validate password
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        return Json(new { success = false, message = "Password is required." }, JsonRequestBehavior.AllowGet);
                    }

                    // Get admin account
                    var hasher = new PasswordHasher();
                    var admin = db.tbl_admin.OrderBy(a => a.AdminID).FirstOrDefault();
                    if (admin == null)
                    {
                        return Json(new { success = false, message = "No admin account found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Verify admin password
                    var result = hasher.VerifyHashedPassword(admin.Adminpassword, password);
                    if (result != PasswordVerificationResult.Success)
                    {
                        return Json(new { success = false, message = "Incorrect admin password." }, JsonRequestBehavior.AllowGet);
                    }

                    // Find the employee
                    var employee = db.tbl_employee.FirstOrDefault(e => e.EmployeeID == employeeId);
                    if (employee == null)
                    {
                        return Json(new { success = false, message = "Employee not found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Check if already active
                    if (employee.IsDisabled == false)
                    {
                        return Json(new { success = false, message = "Employee is already active." }, JsonRequestBehavior.AllowGet);
                    }

                    // Store employee details for logging
                    var employeeName = employee.Employeename;
                    var employeeEmail = employee.Employeeemail;

                    // Reactivate employee
                    employee.IsDisabled = false;
                    employee.Dateupdated = DateTime.Now;
                    db.SaveChanges();

                    // Log the action
                    var logEntry = new tblLogsModel
                    {
                        AdminID = admin.AdminID,
                        EmployeeID = 0,
                        Logaction = "Reactivate Employee",
                        Logdetails = $"Employee '{employeeName}' (Email: {employeeEmail}, ID: {employeeId}) has been reactivated by admin {admin.Adminname}",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);

                    return Json(new { success = true, message = "Employee reactivated successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        // Delete Employee (hard delete - permanent)
        [HttpPost]
        public JsonResult DeleteEmployee(int employeeId, string password)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Validate password
                    if (string.IsNullOrWhiteSpace(password))
                    {
                        return Json(new { success = false, message = "Password is required." }, JsonRequestBehavior.AllowGet);
                    }

                    // Get admin account
                    var hasher = new PasswordHasher();
                    var admin = db.tbl_admin.OrderBy(a => a.AdminID).FirstOrDefault();
                    if (admin == null)
                    {
                        return Json(new { success = false, message = "No admin account found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Verify admin password
                    var result = hasher.VerifyHashedPassword(admin.Adminpassword, password);
                    if (result != PasswordVerificationResult.Success)
                    {
                        return Json(new { success = false, message = "Incorrect admin password." }, JsonRequestBehavior.AllowGet);
                    }

                    // Find the employee
                    var employee = db.tbl_employee.FirstOrDefault(e => e.EmployeeID == employeeId);
                    if (employee == null)
                    {
                        return Json(new { success = false, message = "Employee not found." }, JsonRequestBehavior.AllowGet);
                    }

                    // Store employee details for logging
                    var employeeName = employee.Employeename;
                    var employeeEmail = employee.Employeeemail;
                    var employeeIdNum = employee.EmployeeID;

                    // Hard delete - remove from database
                    db.tbl_employee.Remove(employee);
                    db.SaveChanges();

                    // Log the action
                    var logEntry = new tblLogsModel
                    {
                        AdminID = admin.AdminID,
                        EmployeeID = 0,
                        Logaction = "Delete Employee",
                        Logdetails = $"Employee '{employeeName}' (Email: {employeeEmail}, ID: {employeeIdNum}) has been permanently deleted by admin {admin.Adminname}",
                        Logtime = DateTime.Now.TimeOfDay,
                        Datecreated = DateTime.Now
                    };
                    LogFunction(logEntry);

                    return Json(new { success = true, message = "Employee permanently deleted successfully." }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                string errorMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return Json(new { success = false, message = "Error: " + errorMsg }, JsonRequestBehavior.AllowGet);
            }
        }

        //Product Functions

        // Add Product
        // Add Product
        public JsonResult addProduct(productInformation productInfo)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Check for duplicate product name (case-insensitive)
                    bool productExists = db.tbl_products.Any(p =>
                        p.Productname.ToLower() == productInfo.Productname.ToLower());

                    if (productExists)
                    {
                        return Json(new
                        {
                            Success = false,
                            Message = "A product with this name already exists. Please use a different product name."
                        });
                    }

                    // --- Save Product ---
                    var newProduct = new tblProductsModel()
                    {
                        Productname = productInfo.Productname,
                        Productprice = productInfo.Productprice,
                        Productpicpath = productInfo.Productpicpath,
                        Productpicfilename = productInfo.Productpicfilename,
                        Datecreated = DateTime.Now,
                        Dateupdated = DateTime.Now
                    };

                    db.tbl_products.Add(newProduct);
                    db.SaveChanges();

                    int newProductId = newProduct.ProductID;

                    // --- Save Category ---
                    var category = new tblCategoryModel()
                    {
                        ProductID = newProductId,
                        Categoryname = productInfo.CategoryName,
                        Datecreated = DateTime.Now,
                        Dateupdated = DateTime.Now
                    };

                    db.tbl_category.Add(category);
                    db.SaveChanges();

                    // --- Save Initial Stock ---
                    var stock = new tblStockModel()
                    {
                        ProductID = newProductId,
                        Quantity = productInfo.InitialStock,
                        Restockdate = DateTime.Now,
                        Datecreated = DateTime.Now,
                        Dateupdated = DateTime.Now
                    };

                    db.tbl_restock.Add(stock);
                    db.SaveChanges();

                    // --- Save Add-ons ---
                    if (productInfo.customAddons != null && productInfo.customAddons.Count > 0)
                    {
                        foreach (var addon in productInfo.customAddons)
                        {
                            var newAddon = new tblAddonModel()
                            {
                                ProductID = newProductId,
                                addonName = addon.addonName,
                                addonPrice = addon.addonPrice,
                                Datecreated = DateTime.Now,
                                Dateupdated = DateTime.Now
                            };
                            db.tbl_addon.Add(newAddon);
                        }
                        db.SaveChanges();
                    }

                    return Json(new
                    {
                        Success = true,
                        Message = "Product added successfully!",
                        ProductID = newProductId
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message });
            }
        }

        //get Products
        public JsonResult GetProducts()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var products = (from p in db.tbl_products
                                    join c in db.tbl_category on p.ProductID equals c.ProductID
                                    join s in db.tbl_restock on p.ProductID equals s.ProductID
                                    select new
                                    {
                                        id = p.ProductID,
                                        name = p.Productname,
                                        price = p.Productprice,
                                        category = c.Categoryname,
                                        stock = s.Quantity,
                                        status = s.Quantity > 0 ? "active" : "out",
                                        image = p.Productpicpath,
                                        addons = db.tbl_addon
                                                   .Where(a => a.ProductID == p.ProductID)
                                                   .Select(a => new { name = a.addonName, price = a.addonPrice })
                                                   .ToList()
                                    }).ToList();

                    return Json(new { Success = true, Products = products }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult updateProduct(productInformation productInfo)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var existingProduct = db.tbl_products.Find(productInfo.ProductID);
                    if (existingProduct == null)
                        return Json(new { Success = false, Message = "Product not found." });

                    // Check for duplicate product name (excluding the current product)
                    bool duplicateName = db.tbl_products.Any(p =>
                        p.ProductID != productInfo.ProductID &&
                        p.Productname.ToLower() == productInfo.Productname.ToLower());

                    if (duplicateName)
                    {
                        return Json(new
                        {
                            Success = false,
                            Message = "Another product with this name already exists. Please use a different product name."
                        });
                    }

                    // --- Update product details ---
                    existingProduct.Productname = productInfo.Productname;
                    existingProduct.Productprice = productInfo.Productprice;
                    existingProduct.Productpicpath = productInfo.Productpicpath;
                    existingProduct.Productpicfilename = productInfo.Productpicfilename;
                    existingProduct.Dateupdated = DateTime.Now;

                    db.SaveChanges();

                    // --- Update Category ---
                    var category = db.tbl_category.FirstOrDefault(c => c.ProductID == productInfo.ProductID);
                    if (category != null)
                    {
                        category.Categoryname = productInfo.CategoryName;
                        category.Dateupdated = DateTime.Now;
                    }
                    else
                    {
                        db.tbl_category.Add(new tblCategoryModel
                        {
                            ProductID = productInfo.ProductID,
                            Categoryname = productInfo.CategoryName,
                            Datecreated = DateTime.Now,
                            Dateupdated = DateTime.Now
                        });
                    }
                    db.SaveChanges();

                    // --- Update Stock ---
                    var stock = db.tbl_restock.FirstOrDefault(s => s.ProductID == productInfo.ProductID);
                    if (stock != null)
                    {
                        stock.Quantity = productInfo.InitialStock;
                        stock.Dateupdated = DateTime.Now;
                    }
                    else
                    {
                        db.tbl_restock.Add(new tblStockModel
                        {
                            ProductID = productInfo.ProductID,
                            Quantity = productInfo.InitialStock,
                            Restockdate = DateTime.Now,
                            Datecreated = DateTime.Now,
                            Dateupdated = DateTime.Now
                        });
                    }
                    db.SaveChanges();

                    // --- Update Add-ons ---
                    var existingAddons = db.tbl_addon.Where(a => a.ProductID == productInfo.ProductID).ToList();
                    db.tbl_addon.RemoveRange(existingAddons);
                    db.SaveChanges();

                    if (productInfo.customAddons != null && productInfo.customAddons.Count > 0)
                    {
                        foreach (var addon in productInfo.customAddons)
                        {
                            db.tbl_addon.Add(new tblAddonModel
                            {
                                ProductID = productInfo.ProductID,
                                addonName = addon.addonName,
                                addonPrice = addon.addonPrice,
                                Datecreated = DateTime.Now,
                                Dateupdated = DateTime.Now
                            });
                        }
                        db.SaveChanges();
                    }

                    return Json(new { Success = true, Message = "Product updated successfully!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message });
            }
        }

        [HttpPost]
        public JsonResult UpdateEmployee(employeeInformation employeeInfo)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var existingEmployee = db.tbl_employee.Find(employeeInfo.EmployeeID);
                    if (existingEmployee == null)
                        return Json(new { Success = false, Message = "Employee not found." });

                    // Check for duplicate email (excluding the current employee)
                    bool emailExists = db.tbl_employee.Any(e =>
                        e.EmployeeID != employeeInfo.EmployeeID &&
                        e.Employeeemail.ToLower() == employeeInfo.Employeeemail.ToLower());

                    if (emailExists)
                    {
                        return Json(new
                        {
                            Success = false,
                            Message = "Email address is already registered to another employee. Please use a different email address."
                        });
                    }

                    // Update employee details
                    existingEmployee.Employeename = employeeInfo.Employeename;
                    existingEmployee.Employeecontact = employeeInfo.Employeecontact;
                    existingEmployee.Employeeemail = employeeInfo.Employeeemail;

                    // Only update password if it's provided and not empty
                    if (!string.IsNullOrEmpty(employeeInfo.Employeepassword))
                    {
                        var hasher = new PasswordHasher();
                        existingEmployee.Employeepassword = hasher.HashPassword(employeeInfo.Employeepassword);
                    }

                    existingEmployee.Dateupdated = DateTime.Now;

                    db.SaveChanges();

                    var employeeData = new
                    {
                        id = existingEmployee.EmployeeID,
                        name = existingEmployee.Employeename,
                        contact = existingEmployee.Employeecontact,
                        email = existingEmployee.Employeeemail
                    };

                    return Json(new
                    {
                        Success = true,
                        Message = "Employee updated successfully!",
                        Employee = employeeData
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = "Failed to update employee: " + ex.Message });
            }
        }

        public JsonResult DeleteProduct(int id)
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    // Find the product
                    var product = db.tbl_products.FirstOrDefault(p => p.ProductID == id);
                    if (product == null)
                        return Json(new { Success = false, Message = "Product not found." });

                    // Remove related entries first (Category, Stock, Addons) if needed
                    var categories = db.tbl_category.Where(c => c.ProductID == id);
                    db.tbl_category.RemoveRange(categories);

                    var stock = db.tbl_restock.Where(s => s.ProductID == id);
                    db.tbl_restock.RemoveRange(stock);

                    var addons = db.tbl_addon.Where(a => a.ProductID == id);
                    db.tbl_addon.RemoveRange(addons);

                    // Remove product
                    db.tbl_products.Remove(product);
                    db.SaveChanges();

                    return Json(new { Success = true, Message = "Product deleted successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = ex.Message });
            }
        }

        //Dashboard 
        public JsonResult GetTodaySales()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    DateTime today = DateTime.Today;
                    DateTime tomorrow = today.AddDays(1);

                    var totalSales = db.tbl_orders
                        .Where(o => o.Datecreated >= today && o.Datecreated < tomorrow)
                        //.Where(o => o.Orderstatus == "Completed") // optional filter
                        .Sum(o => (decimal?)o.Ordertotal) ?? 0;

                    return Json(new
                    {
                        success = true,
                        totalSales = totalSales
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    success = false,
                    message = ex.Message
                }, JsonRequestBehavior.AllowGet);
            }
        }

        public JsonResult GetTotalOrdersToday()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    DateTime today = DateTime.Today; // Midnight today
                    DateTime tomorrow = today.AddDays(1);

                    int totalOrdersToday = db.tbl_orders
                        .Count(o => o.Datecreated >= today && o.Datecreated < tomorrow);

                    DateTime yesterday = today.AddDays(-1);
                    int totalOrdersYesterday = db.tbl_orders
                        .Count(o => o.Datecreated >= yesterday && o.Datecreated < today);

                    return Json(new
                    {
                        success = true,
                        totalOrders = totalOrdersToday,
                        totalOrdersYesterday = totalOrdersYesterday
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        public JsonResult GetTopSellingItemToday()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    DateTime today = DateTime.Today;
                    DateTime tomorrow = today.AddDays(1);

                    // Get order items only from today's orders
                    var topItem = db.tbl_orderitems
                        .Join(db.tbl_orders, oi => oi.OrderID, o => o.OrderID, (oi, o) => new { oi, o })
                        .Where(x => x.o.Datecreated >= today && x.o.Datecreated < tomorrow)
                        .GroupBy(x => x.oi.ProductID)
                        .Select(g => new
                        {
                            ProductID = g.Key,
                            TotalSold = g.Sum(x => x.oi.Quantity)
                        })
                        .OrderByDescending(x => x.TotalSold)
                        .FirstOrDefault();

                    if (topItem != null)
                    {
                        var product = db.tbl_products.FirstOrDefault(p => p.ProductID == topItem.ProductID);
                        if (product != null)
                        {
                            return Json(new
                            {
                                success = true,
                                productName = product.Productname,
                                totalSold = topItem.TotalSold
                            }, JsonRequestBehavior.AllowGet);
                        }
                    }

                    // No orders today
                    return Json(new
                    {
                        success = true,
                        productName = "No orders yet",
                        totalSold = 0
                    }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }



        [HttpGet]
        public JsonResult GetSalesByCategory()
        {
            using (var db = new CoffeeShopContext())
            {
                var data = (from oi in db.tbl_orderitems
                            join p in db.tbl_products on oi.ProductID equals p.ProductID
                            join c in db.tbl_category on p.ProductID equals c.ProductID
                            group oi by c.Categoryname into g
                            select new
                            {
                                Category = g.Key,
                                TotalSales = g.Sum(x => x.Quantity)
                            }).ToList();

                return Json(data, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetWeeklySales()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    DateTime today = DateTime.Now.Date;

                    // Start of week (Monday)
                    int diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
                    DateTime startOfWeek = today.AddDays(-1 * diff);
                    DateTime endOfWeek = startOfWeek.AddDays(7);

                    var rawData = (from order in db.tbl_orders
                                   join item in db.tbl_orders on order.OrderID equals item.OrderID
                                   where order.Datecreated >= startOfWeek && order.Datecreated < endOfWeek
                                   select new
                                   {
                                       order.Datecreated,
                                       item.Ordertotal
                                   })
                                   .ToList();

                    var weeklyData = rawData
                        .GroupBy(x => x.Datecreated.DayOfWeek)
                        .Select(g => new
                        {
                            Day = g.Key.ToString().Substring(0, 3), // e.
                            Total = g.Sum(x => x.Ordertotal)
                        })
                        .ToList();

                    return Json(new { success = true, data = weeklyData }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        [HttpGet]
        public JsonResult GetMonthlySales()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    var currentYear = DateTime.Now.Year;
                    var currentMonth = DateTime.Now.Month;

                    // Get the first day of the current month
                    var startOfMonth = new DateTime(currentYear, currentMonth, 1);

                    var rawData = (from order in db.tbl_orders
                                   join item in db.tbl_orders
                                   on order.OrderID equals item.OrderID
                                   where order.Datecreated >= startOfMonth
                                   select new
                                   {
                                       Month = order.Datecreated.Month,
                                       item.Ordertotal
                                   }).ToList();

                    var monthlyData = rawData
                        .GroupBy(x => x.Month)
                        .Select(g => new
                        {
                            Month = g.Key, // 1–12 (month number)
                            Total = g.Sum(x => x.Ordertotal) // Just sum the price without multiplying
                        })
                        .ToList();

                    return Json(new { success = true, data = monthlyData }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetTrafficData()
        {
            try
            {
                using (var db = new CoffeeShopContext())
                {
                    DateTime today = DateTime.Now.Date;
                    DateTime tomorrow = today.AddDays(1);

                    var todayOrders = db.tbl_orders
                                        .Where(o => o.Datecreated >= today && o.Datecreated < tomorrow)
                                        .ToList();

                    // Define 2-hour intervals: 0-2, 2-4, ..., 22-24
                    var trafficData = Enumerable.Range(0, 12) // 12 intervals of 2 hours
                        .Select(i => new
                        {
                            StartHour = i * 2,
                            Count = todayOrders.Count(o => o.Datecreated.Hour >= i * 2 && o.Datecreated.Hour < (i + 1) * 2)
                        })
                        .ToList();

                    return Json(new { success = true, data = trafficData }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }





    }
}


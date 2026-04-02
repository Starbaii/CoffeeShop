using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblEmployeesModel
    {
        public int EmployeeID { get; set; }
        public string Employeename { get; set; }
        public string Employeecontact { get; set; }
        public string Employeeemail { get; set; }
        public string Employeepassword { get; set; }
        public bool IsDisabled { get; set; }  // Maps to TINYINT(1)
        public DateTime? LastLoginDate { get; set; }  // Maps to DATETIME
        public bool IsCurrentlyLoggedIn { get; set; }  // Maps to TINYINT(1)
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}
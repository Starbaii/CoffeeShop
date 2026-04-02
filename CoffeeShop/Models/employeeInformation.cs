using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models
{
    public class employeeInformation
    {
        public int EmployeeID { get; set; }
        public string Employeename { get; set; }
        public string Employeecontact { get; set; }
        public string Employeeemail { get; set; }
        public string Employeepassword { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}
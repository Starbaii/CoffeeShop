using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblLogsModel
    {
        public int LogID { get; set; }
        public int AdminID { get; set; }
        public int EmployeeID { get; set; }
        public string Logaction { get; set; }
        public string Logdetails { get; set; }
        public TimeSpan Logtime{ get; set; }
        public DateTime Datecreated { get; set; }   
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblOrdersModel
    {
        public int OrderID { get; set; }
        public int EmployeeID { get; set; }
        public int Ordercode { get; set; }
        public string Ordertype{ get; set; }
        public decimal Ordertotal { get; set; }
        public string Orderstatus { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }   
    }
}
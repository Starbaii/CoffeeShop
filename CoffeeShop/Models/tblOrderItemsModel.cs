using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblOrderItemsModel
    {
        public int OrderItemID { get; set; }
        public int OrderID { get; set; }
        public int ProductID { get; set; }
        public string DrinkType { get; set; }
        public int Quantity { get; set; }
        public string Addons { get; set; }
        public decimal Price { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }   
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models
{
    public class stockInformation
    {
        public int ProductID { get; set; }
        public int Quantity { get; set; }
        public DateTime Restockdate { get; set; }

        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}
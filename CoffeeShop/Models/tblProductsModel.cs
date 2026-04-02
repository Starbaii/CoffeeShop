using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CoffeeShop.Models
{
    public class tblProductsModel
    {
        public int ProductID { get; set; }

        public string Productname { get; set; }
        public float Productprice { get; set; }

        public string Productpicpath { get; set; }
        public string Productpicfilename { get; set; }
        public DateTime Datecreated { get; set; }
        public DateTime Dateupdated { get; set; }
    }
}
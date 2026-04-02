using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls.WebParts;
using System.ComponentModel.DataAnnotations;       
using System.ComponentModel.DataAnnotations.Schema;

namespace CoffeeShop.Models
{
    public class tblAdminsModel
    {
        public int AdminID { get; set; }
        public string Adminname { get; set; }
        public string Adminemail { get; set; }
        public string Adminpassword { get; set; }
        public DateTime Datecreated { get; set; }   
        public DateTime Dateupdated { get; set; }   
    }
}
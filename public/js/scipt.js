const checkbox=document.querySelector(".mainHeader__option--profile-dropdown-input");
const boxToShow=document.querySelector(".mainHeader__option--profile-dropdown-show");

checkbox.addEventListener('change',function(){
  if(this.checked){
    boxToShow.style.height='10rem';
    boxToShow.style.opacity="1";
    boxToShow.style.width="14rem";
    boxToShow.style.borderRadius="1rem";
    boxToShow.style.display="flex";
    boxToShow.style.transition="all .5s";
  }
  else{
    boxToShow.style.height='0rem';
    boxToShow.style.opacity="0";
    boxToShow.style.width="0rem";
    boxToShow.style.display="none"
    boxToShow.style.transition="all .5s"
  }

})

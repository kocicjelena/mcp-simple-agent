/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
//import BASE_URL from './baseurl';

const listFiles = async (a:any)=> {
    const urlstring = "/`${a}`";
    try {
      const response = await axios({
        method: 'get',
        url: urlstring
      }).then((responseData)=>{
        //console.log(responseData.data,'libs/listmodel');
        return responseData})
      .catch(error => {
          //console.log(error.response)
      });
       if(response) 
        //const responseData = response;
       return response;
       //response is data.response, which is the list of models
    } catch (error) {
     //console.log(error,'er');
      return null;
    }
  };
  export default listFiles;
import { FormInput, FormSelect, Label, Loader, PageHeader } from 'components';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

import {
  db,
  addDoc,
  collection,
  serverTimestamp,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase.config';
import { useAuth } from 'hooks/useAuth';
import { useNavigate } from 'react-router';
import { categories } from 'common/lookup-data';

const initialValues = {
  type: 'rent',
  title: '',
  category: null,
  squareFeet: 20,
  rooms: 1,
  beds: 1,
  bathrooms: 1,
  furnished: true,
  parking: false,
  offer: false,
  address: '',
  latitude: 0,
  longitude: 0,
  description: '',
  regularPrice: 0,
  offerPrice: 0,
  images: {},
};

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [values, setValues] = useState(initialValues);
  const {
    type,
    title,
    category,
    squareFeet,
    rooms,
    beds,
    bathrooms,
    furnished,
    parking,
    address,
    latitude,
    longitude,
    offer,
    description,
    regularPrice,
    offerPrice,
    images,
  } = values;

  const handleChange = (e) => {
    let boolean = null;

    const { name, value } = e.target;
    console.log(value);
    if (value === 'true') {
      boolean = true;
    }
    if (value === 'false') {
      boolean = false;
    }

    if (e.target.files)
      setValues((preValues) => ({ ...preValues, images: e.target.files }));

    if (!e.target.files)
      setValues((preValues) => ({ ...preValues, [name]: boolean ?? value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('submitted values', values);
    setLoading(true);
    if (+offerPrice >= +regularPrice) {
      setLoading(false);
      toast.error('Offer price should be lower than regular price!');
      return;
    }
    if (images.length > 6) {
      setLoading(false);
      toast.error('Maximum 6 images are allowed to upload!');
      return;
    }
    console.log('continue....');
    let geolocation = {};
    let location;
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );
      const data = await response.json();
      console.log('geo data', data);
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;
      geolocation.address = data.results[0]?.formatted_address ?? '';

      location = data.status === 'ZERO_RESULTS' && undefined;

      if (location === undefined) {
        setLoading(false);
        toast.error('Please enter a valid address!');
        return;
      }
    } else {
      setGeolocationEnabled(false);
      geolocation.lat = latitude;
      geolocation.lng = longitude;
      geolocation.address = address;
    }

    const handleUploadImageToStore = async (image) => {
      return new Promise((resolve, reject) => {
        const fileName = `${user?.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
              // default:
              //   return console.log('Upload is successful');
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };
    const imgUrls = await Promise.all(
      [...images].map((image) => handleUploadImageToStore(image))
    ).catch((error) => {
      setLoading(false);
      console.log('Error Add Listing imgUrls: ', error);
      toast.error('Images not uploaded!');
    });

    const listingData = {
      ...values,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
      userRef: user.uid,
    };
    delete listingData.images;
    delete listingData.latitude;
    delete listingData.longitude;
    !listingData.offer && delete listingData.offerPrice;
    console.log('listingData', listingData);
    const listingDoc = await addDoc(collection(db, 'listings'), listingData);
    setLoading(false);
    toast.success('Listing created successfully!');
    navigate(`/listings/${type}/${listingDoc.id}`);
  };

  if (isLoading) return <Loader />;

  return (
    <main className='max-w-md mx-auto px-2'>
      <PageHeader text='Add your Property' />
      <form onSubmit={handleSubmit}>
        <Label text='Sell / Rent' />
        <div className='flex justify-center items-center'>
          <button
            name='type'
            type='button'
            value={'sale'}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out mr-3 px-7 py-3 w-full
            ${type === 'rent' ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            Sale
          </button>
          <button
            name='type'
            type='button'
            value='rent'
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out px-7 py-3 w-full
            ${type === 'sale' ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            Rent
          </button>
        </div>
        <Label text='Title' />
        <FormInput
          name='title'
          value={title}
          type='text'
          maxLength='32'
          minLength='10'
          onChange={handleChange}
          placeholder='Title'
          required
        />
        <div className='flex justify-center items-center space-x-3'>
          <div className='flex flex-col space-y-0.5 w-full'>
            <Label text='category' />
            <FormSelect
              value={category}
              name={'category'}
              className=''
              onChange={handleChange}
              required
              listData={categories}
            />
          </div>
          <div className='flex flex-col space-y-0.5 w-full'>
            <Label text='squareFeet' />
            <FormInput
              name='squareFeet'
              value={squareFeet}
              min='20'
              max='500'
              type='number'
              onChange={handleChange}
              placeholder='squareFeet'
              required
            />
          </div>
        </div>
        <div className='flex justify-center items-center space-x-2'>
          <div className='flex flex-col space-y-0.5 w-full'>
            <Label text='Rooms' />
            <FormInput
              name='rooms'
              value={rooms}
              min='1'
              max='50'
              type='number'
              onChange={handleChange}
              placeholder='Rooms'
              required
            />
          </div>
          <div className='flex flex-col space-y-0.5 w-full'>
            <Label text='beds' />
            <FormInput
              name='beds'
              value={beds}
              min='1'
              max='50'
              type='number'
              onChange={handleChange}
              placeholder='beds'
              required
            />
          </div>
          <div className='flex flex-col space-y-0.5 w-full'>
            <Label text='Bathrooms' />
            <FormInput
              name='bathrooms'
              value={bathrooms}
              min='1'
              max='50'
              type='number'
              onChange={handleChange}
              placeholder='Bathrooms'
              required
            />
          </div>
        </div>
        <Label text='Furnished' />
        <div className='flex justify-center items-center'>
          <button
            name='furnished'
            type='button'
            value={true}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out mr-3 px-7 py-3 w-full
            ${!furnished ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            Yes
          </button>
          <button
            name='furnished'
            type='button'
            value={false}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out px-7 py-3 w-full
            ${furnished ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            No
          </button>
        </div>
        <Label text='Parking Spot' />
        <div className='flex justify-center items-center'>
          <button
            name='parking'
            type='button'
            value={true}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out mr-3 px-7 py-3 w-full
            ${!parking ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            Yes
          </button>
          <button
            name='parking'
            type='button'
            value={false}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out px-7 py-3 w-full
            ${parking ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            No
          </button>
        </div>
        <Label text='Address' />
        <FormInput
          name='address'
          value={address}
          type='text'
          onChange={handleChange}
          placeholder='Address'
          required
        />
        {!geolocationEnabled && (
          <div className='flex justify-center items-center space-x-2 w-full'>
            <div className='flex flex-col space-y-0.5 w-full'>
              <Label text='latitude' />
              <FormInput
                name='latitude'
                value={latitude}
                min='-90'
                max='90'
                type='number'
                onChange={handleChange}
                placeholder='latitude'
                required={!geolocationEnabled}
              />
            </div>
            <div className='flex flex-col space-y-0.5 w-full'>
              <Label text='longitude' />
              <FormInput
                name='longitude'
                value={longitude}
                min='-180'
                max='180'
                type='number'
                onChange={handleChange}
                placeholder='longitude'
                required={!geolocationEnabled}
              />
            </div>
          </div>
        )}
        <Label text='description' />
        <textarea
          name='description'
          value={description}
          type='text'
          onChange={handleChange}
          placeholder='description'
          className='focus:outline-none w-full min-h-max px-4 py-2 text-base placeholder:capitalize placeholder:text-light text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white'
          rows={3}
          required
        />
        <Label text='Offer' />
        <div className='flex justify-center items-center'>
          <button
            name='offer'
            type='button'
            value={true}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out mr-3 px-7 py-3 w-full
            ${!offer ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            Yes
          </button>
          <button
            name='offer'
            type='button'
            value={false}
            onClick={handleChange}
            className={`rounded shadow-md hover:shadow-lg active:shadow-lg transition duration-150 ease-in-out px-7 py-3 w-full
            ${offer ? 'bg-white text-dark' : 'bg-dark text-white'}`}
          >
            No
          </button>
        </div>
        <div className='flex justify-between items-center space-x-5'>
          <div className='flex flex-col space-y-0.5 w-1/2'>
            <Label text='regular price' />
            <FormInput
              name='regularPrice'
              value={regularPrice}
              min={50}
              max={500000}
              type='number'
              onChange={handleChange}
              placeholder='regular price'
              className='w-full mr-3'
              required
            />
          </div>
          {type === 'rent' && (
            <div className='flex flex-col flex-1 h-full w-full space-y-6'>
              <Label />
              <p
                text='€ / Month'
                className='text-md  justify-start whitespace-nowrap'
              >
                € / Month
              </p>
            </div>
          )}
        </div>
        {offer && (
          <div className='flex justify-between items-center space-x-5'>
            <div className='flex flex-col space-y-0.5 w-1/2'>
              <Label text='offer price' />
              <FormInput
                name='offerPrice'
                value={offerPrice}
                min={50}
                max={500000}
                type='number'
                onChange={handleChange}
                placeholder='offer price'
                className='w-full mr-3'
                required={offer}
              />
            </div>
            {type === 'rent' && (
              <div className='flex flex-col flex-1 h-full w-full space-y-6'>
                <Label />
                <p
                  text='€ / Month'
                  className='text-md  justify-start whitespace-nowrap'
                >
                  € / Month
                </p>
              </div>
            )}
          </div>
        )}
        <div className='flex flex-col'>
          <Label text='images' className='mb-0' />
          <p className='mt-0 text-sm text-gray-400'>
            The first image will be the cover (max 6)
          </p>
          <label className='block'>
            <span className='sr-only'>Choose Image/s</span>
            <input
              type='file'
              name='images'
              accept='.jpg,.png,.jpeg'
              multiple
              required
              onChange={handleChange}
              className='mt-3 mb-6 block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-7 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-dark file:text-white hover:file:bg-darker hover:file:shadow-lg transition duration-150 ease-in-out'
            />
          </label>
        </div>
        <button
          type='submit'
          className='mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out'
        >
          Add Listing
        </button>
      </form>
    </main>
  );
};

export default AddListing;

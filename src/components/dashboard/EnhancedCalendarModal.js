// src/components/dashboard/EnhancedCalendarModal.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EnhancedCalendarModal({
 showModal,
 onClose,
 selectedDate,
 selectedDateData,
 onDeleteEntry,
 deleteLoading,
 statusMessage,
 error,
 onClearMessages
}) {
 const navigate = useNavigate();
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [entryToDelete, setEntryToDelete] = useState(null);

 if (!showModal) return null;

 const formatSelectedDate = (dateStr) => {
   const date = new Date(dateStr);
   return date.toLocaleDateString('en-US', { 
     weekday: 'long', 
     year: 'numeric', 
     month: 'long', 
     day: 'numeric' 
   });
 };

 const handleEdit = (entryType, entryId) => {
   const routes = {
     headache: '/record-headache',
     medication: '/record-medication'
   };
   const route = routes[entryType];
   if (route) {
     navigate(`${route}?mode=edit&id=${entryId}&date=${selectedDate}`);
     onClose();
   }
 };

 const handleDeleteClick = (entryType, entryId, entryName) => {
   setEntryToDelete({ type: entryType, id: entryId, name: entryName });
   setShowDeleteConfirm(true);
 };

 const handleConfirmDelete = async () => {
   if (entryToDelete) {
     await onDeleteEntry(entryToDelete.type, entryToDelete.id);
     setShowDeleteConfirm(false);
     setEntryToDelete(null);
   }
 };

 const handleCancelDelete = () => {
   setShowDeleteConfirm(false);
   setEntryToDelete(null);
 };

 const handleQuickAdd = (type) => {
   const routes = {
     headache: '/record-headache',
     medication: '/record-medication',
     sleep: '/record-sleep',
     stress: '/record-stress',
     exercise: '/record-exercise',
     nutrition: '/record-nutrition'
   };
   navigate(`${routes[type]}?date=${selectedDate}&mode=manual-entry`);
   onClose();
 };

 return (
   <div style={{
     position: 'fixed',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     background: 'rgba(0, 0, 0, 0.5)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     zIndex: 1000,
     padding: '20px'
   }}>
     <div style={{
       background: '#FFFFFF',
       borderRadius: '16px',
       padding: '2rem',
       maxWidth: '500px',
       width: '100%',
       maxHeight: '80vh',
       overflowY: 'auto',
       position: 'relative',
       boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
     }}>
       {/* Close Button */}
       <button
         onClick={onClose}
         style={{
           position: 'absolute',
           top: '1rem',
           right: '1rem',
           background: 'transparent',
           border: 'none',
           fontSize: '1.5rem',
           color: '#9CA3AF',
           cursor: 'pointer'
         }}
       >
         <i className="fas fa-times"></i>
       </button>

       {/* Modal Header */}
       <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
         <h3 style={{ 
           margin: '0 0 0.5rem 0', 
           fontSize: '1.5rem', 
           fontWeight: '600',
           color: '#1E3A8A'
         }}>
           {selectedDateData ? 'Manage Day' : 'Add Data'}
         </h3>
         <p style={{ 
           margin: 0, 
           color: '#6B7280', 
           fontSize: '1rem' 
         }}>
           {selectedDate && formatSelectedDate(selectedDate)}
         </p>
       </div>

       {/* Status Messages */}
       {(error || statusMessage) && (
         <div style={{ marginBottom: '2rem' }}>
           {error && (
             <div style={{
               background: '#f8d7da',
               border: '1px solid #dc3545',
               borderRadius: '8px',
               padding: '12px',
               marginBottom: '1rem',
               color: '#721c24',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between'
             }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
                 {error}
               </div>
               {onClearMessages && (
                 <button
                   onClick={onClearMessages}
                   style={{
                     background: 'transparent',
                     border: 'none',
                     color: '#721c24',
                     cursor: 'pointer',
                     fontSize: '1rem'
                   }}
                 >
                   <i className="fas fa-times"></i>
                 </button>
               )}
             </div>
           )}

           {statusMessage && (
             <div style={{
               background: '#d4edda',
               border: '1px solid #28a745',
               borderRadius: '8px',
               padding: '12px',
               marginBottom: '1rem',
               color: '#155724',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between'
             }}>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                 <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                 {statusMessage}
               </div>
               {onClearMessages && (
                 <button
                   onClick={onClearMessages}
                   style={{
                     background: 'transparent',
                     border: 'none',
                     color: '#155724',
                     cursor: 'pointer',
                     fontSize: '1rem'
                   }}
                 >
                   <i className="fas fa-times"></i>
                 </button>
               )}
             </div>
           )}
         </div>
       )}

       {/* Existing Data Section */}
       {selectedDateData && (
         <div style={{
           background: '#F9FAFB',
           border: '1px solid #E5E7EB',
           borderRadius: '12px',
           padding: '1rem',
           marginBottom: '2rem'
         }}>
           <h4 style={{ 
             margin: '0 0 1rem 0', 
             fontSize: '1rem', 
             fontWeight: '600',
             color: '#374151'
           }}>
             Existing Data:
           </h4>

           {/* Headaches */}
           {selectedDateData.headaches && selectedDateData.headaches.length > 0 && (
             <div style={{ marginBottom: '1rem' }}>
               <h5 style={{ margin: '0 0 0.5rem 0', color: '#DC2626', fontSize: '0.9rem' }}>
                 <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
                 Headaches ({selectedDateData.headaches.length})
               </h5>
               {selectedDateData.headaches.map((headache, index) => (
                 <div key={headache.id || index} style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   padding: '0.5rem',
                   background: '#FFFFFF',
                   borderRadius: '6px',
                   marginBottom: '0.5rem',
                   border: '1px solid #E5E7EB'
                 }}>
                   <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                     {headache.location || 'Unknown type'} - Pain: {headache.painLevel || 0}/10
                     {headache.duration && ` - ${Math.round(headache.duration / 60)}h`}
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button
                       onClick={() => handleEdit('headache', headache.id)}
                       style={{
                         background: '#4682B4',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         padding: '4px 8px',
                         cursor: 'pointer',
                         fontSize: '0.75rem'
                       }}
                     >
                       <i className="fas fa-edit"></i>
                     </button>
                     <button
                       onClick={() => handleDeleteClick('headache', headache.id, headache.location)}
                       disabled={deleteLoading}
                       style={{
                         background: deleteLoading ? '#F87171' : '#DC2626',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         padding: '4px 8px',
                         cursor: deleteLoading ? 'not-allowed' : 'pointer',
                         fontSize: '0.75rem'
                       }}
                     >
                       <i className="fas fa-trash"></i>
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {/* Medications */}
           {selectedDateData.medications && selectedDateData.medications.length > 0 && (
             <div>
               <h5 style={{ margin: '0 0 0.5rem 0', color: '#059669', fontSize: '0.9rem' }}>
                 <i className="fas fa-pills" style={{ marginRight: '0.5rem' }}></i>
                 Medications ({selectedDateData.medications.length})
               </h5>
               {selectedDateData.medications.map((medication, index) => (
                 <div key={medication.id || index} style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   padding: '0.5rem',
                   background: '#FFFFFF',
                   borderRadius: '6px',
                   marginBottom: '0.5rem',
                   border: '1px solid #E5E7EB'
                 }}>
                   <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                     {medication.name || medication.medicationName} - {medication.dosage} {medication.dosageUnit}
                     {medication.effectiveness && ` - Effect: ${medication.effectiveness}/10`}
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button
                       onClick={() => handleEdit('medication', medication.id)}
                       style={{
                         background: '#4682B4',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         padding: '4px 8px',
                         cursor: 'pointer',
                         fontSize: '0.75rem'
                       }}
                     >
                       <i className="fas fa-edit"></i>
                     </button>
                     <button
                       onClick={() => handleDeleteClick('medication', medication.id, medication.name || medication.medicationName)}
                       disabled={deleteLoading}
                       style={{
                         background: deleteLoading ? '#F87171' : '#DC2626',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         padding: '4px 8px',
                         cursor: deleteLoading ? 'not-allowed' : 'pointer',
                         fontSize: '0.75rem'
                       }}
                     >
                       <i className="fas fa-trash"></i>
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}

       {/* Quick Add Section */}
       <div style={{ marginBottom: '1.5rem' }}>
         <h4 style={{ 
           margin: '0 0 1rem 0', 
           fontSize: '1rem', 
           fontWeight: '600',
           color: '#374151'
         }}>
           {selectedDateData ? 'Add More Data:' : 'What would you like to track?'}
         </h4>
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(2, 1fr)',
           gap: '0.75rem'
         }}>
           <button
             onClick={() => handleQuickAdd('headache')}
             style={{
               padding: '1rem',
               background: 'linear-gradient(135deg, #EF4444, #DC2626)',
               border: 'none',
               borderRadius: '12px',
               color: 'white',
               cursor: 'pointer',
               textAlign: 'center',
               fontSize: '0.9rem',
               fontWeight: '600'
             }}
           >
             <i className="fas fa-head-side-virus" style={{ marginRight: '0.5rem' }}></i>
             Log Headache
           </button>

           <button
             onClick={() => handleQuickAdd('medication')}
             style={{
               padding: '1rem',
               background: 'linear-gradient(135deg, #059669, #047857)',
               border: 'none',
               borderRadius: '12px',
               color: 'white',
               cursor: 'pointer',
               textAlign: 'center',
               fontSize: '0.9rem',
               fontWeight: '600'
             }}
           >
             <i className="fas fa-pills" style={{ marginRight: '0.5rem' }}></i>
             Log Medication
           </button>

           <button
             onClick={() => handleQuickAdd('sleep')}
             style={{
               padding: '1rem',
               background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
               border: 'none',
               borderRadius: '12px',
               color: 'white',
               cursor: 'pointer',
               textAlign: 'center',
               fontSize: '0.9rem',
               fontWeight: '600'
             }}
           >
             <i className="fas fa-bed" style={{ marginRight: '0.5rem' }}></i>
             Log Sleep
           </button>

           <button
             onClick={() => handleQuickAdd('stress')}
             style={{
               padding: '1rem',
               background: 'linear-gradient(135deg, #F59E0B, #D97706)',
               border: 'none',
               borderRadius: '12px',
               color: 'white',
               cursor: 'pointer',
               textAlign: 'center',
               fontSize: '0.9rem',
               fontWeight: '600'
             }}
           >
             <i className="fas fa-brain" style={{ marginRight: '0.5rem' }}></i>
             Log Stress
           </button>
         </div>
       </div>

       {/* Additional Quick Actions */}
       <div style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(2, 1fr)',
         gap: '0.75rem',
         marginBottom: '1.5rem'
       }}>
         <button
           onClick={() => handleQuickAdd('exercise')}
           style={{
             padding: '0.75rem',
             background: '#FFFFFF',
             border: '1px solid #E5E7EB',
             borderRadius: '8px',
             color: '#374151',
             cursor: 'pointer',
             fontSize: '0.85rem'
           }}
         >
           <i className="fas fa-dumbbell" style={{ marginRight: '0.5rem' }}></i>
           Exercise
         </button>

         <button
           onClick={() => handleQuickAdd('nutrition')}
           style={{
             padding: '0.75rem',
             background: '#FFFFFF',
             border: '1px solid #E5E7EB',
             borderRadius: '8px',
             color: '#374151',
             cursor: 'pointer',
             fontSize: '0.85rem'
           }}
         >
           <i className="fas fa-apple-alt" style={{ marginRight: '0.5rem' }}></i>
           Nutrition
         </button>
       </div>

       {/* Close Button */}
       <div style={{ textAlign: 'center' }}>
         <button
           onClick={onClose}
           style={{
             background: 'transparent',
             border: '1px solid #E5E7EB',
             borderRadius: '8px',
             color: '#6B7280',
             padding: '0.75rem 1.5rem',
             cursor: 'pointer',
             fontSize: '0.9rem'
           }}
         >
           Cancel
         </button>
       </div>
     </div>

     {/* Delete Confirmation Modal */}
     {showDeleteConfirm && (
       <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         background: 'rgba(0, 0, 0, 0.7)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 1001
       }}>
         <div style={{
           background: '#FFFFFF',
           borderRadius: '12px',
           padding: '2rem',
           maxWidth: '400px',
           width: '90%',
           textAlign: 'center'
         }}>
           <div style={{ fontSize: '3rem', color: '#DC2626', marginBottom: '1rem' }}>
             <i className="fas fa-exclamation-triangle"></i>
           </div>
           <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
             Delete Entry?
           </h3>
           <p style={{ margin: '0 0 2rem 0', color: '#6B7280' }}>
             Are you sure you want to delete "{entryToDelete?.name}"? This action cannot be undone.
           </p>
           <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
             <button
               onClick={handleCancelDelete}
               style={{
                 background: '#F3F4F6',
                 color: '#374151',
                 border: 'none',
                 borderRadius: '8px',
                 padding: '12px 24px',
                 cursor: 'pointer',
                 fontSize: '1rem',
                 fontWeight: '600'
               }}
             >
               Cancel
             </button>
             <button
               onClick={handleConfirmDelete}
               disabled={deleteLoading}
               style={{
                 background: deleteLoading ? '#F87171' : '#DC2626',
                 color: 'white',
                 border: 'none',
                 borderRadius: '8px',
                 padding: '12px 24px',
                 cursor: deleteLoading ? 'not-allowed' : 'pointer',
                 fontSize: '1rem',
                 fontWeight: '600'
               }}
             >
               {deleteLoading ? (
                 <>
                   <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                   Deleting...
                 </>
               ) : (
                 <>
                   <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                   Delete
                 </>
               )}
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
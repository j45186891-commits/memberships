import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function AdminFormDialog({
  open,
  onClose,
  onSave,
  title,
  fields,
  initialData = null,
  loading = false
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize with default values
      const defaults = {};
      fields.forEach((field) => {
        defaults[field.name] = field.defaultValue || '';
      });
      setFormData(defaults);
    }
    setErrors({});
    setSaveError(null);
  }, [initialData, fields, open]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (field.validate) {
        const error = field.validate(formData[field.name], formData);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaveError(null);
      await onSave(formData);
      onClose();
    } catch (error) {
      setSaveError(error.response?.data?.error?.message || 'Failed to save');
    }
  };

  const renderField = (field) => {
    const commonProps = {
      fullWidth: true,
      label: field.label,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      error: !!errors[field.name],
      helperText: errors[field.name] || field.helperText,
      required: field.required,
      disabled: field.disabled || loading
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <TextField
            {...commonProps}
            type={field.type}
            multiline={field.multiline}
            rows={field.rows || 1}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={field.rows || 4}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth error={!!errors[field.name]} required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              label={field.label}
              disabled={field.disabled || loading}
            >
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors[field.name] && (
              <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                {errors[field.name]}
              </Box>
            )}
          </FormControl>
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={field.disabled || loading}
              />
            }
            label={field.label}
          />
        );

      case 'datetime':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label={field.label}
              value={formData[field.name] ? new Date(formData[field.name]) : null}
              onChange={(date) => handleChange(field.name, date?.toISOString())}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors[field.name]}
                  helperText={errors[field.name] || field.helperText}
                  required={field.required}
                />
              )}
              disabled={field.disabled || loading}
            />
          </LocalizationProvider>
        );

      case 'date':
        return (
          <TextField
            {...commonProps}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        );

      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {fields.map((field) => (
            <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
              {renderField(field)}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdminFormDialog;
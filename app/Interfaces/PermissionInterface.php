<?php

namespace App\Interfaces\Interfaces;

interface PermissionInterface
{
    public function all();
    public function find($id);
    public function store(array $data);
    public function update($id, array $data);
    public function delete($id);
}
